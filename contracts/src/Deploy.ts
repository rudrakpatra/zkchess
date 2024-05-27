import { execSync as sh } from 'child_process';
import fs from 'fs-extra';
import fetch, { RequestInfo } from 'node-fetch';
import util from 'util';
import ora from 'ora';
import red from 'chalk';
import green from 'chalk';
import { PrivateKey, Mina, addCachedAccount, Types, AccountUpdate } from 'o1js';
import { GameOfLife, GameOfLifeZkProgram } from './index.js';
const log = console.log;

const DEFAULT_GRAPHQL = 'https://proxy.berkeley.minaexplorer.com/graphql'; // The endpoint used to interact with the network
const DIR = sh('npm prefix').toString().replace(/\n$/, '');

const alias = 'berkeley'.toLowerCase();

let config;
// Read config.json
try {
  log('Reading config.json...', `${DIR}/config.json`);
  config = fs.readJSONSync(`${DIR}/config.json`);
} catch (err: any) {
  let str;
  if (err.code === 'ENOENT') {
    str = `config.json not found. Make sure you're in a zkApp project directory.`;
  } else {
    str = 'Unable to read config.json.';
    console.error(err);
  }
  log(red(str));
  process.exit(0);
}
const graphQLUrl = config.deployAliases[alias]?.url ?? DEFAULT_GRAPHQL;
// Attempt to import the zkApp private key from the `keys` directory and the feepayor private key. These keys will be used to deploy the zkApp.
let feepayerPrivateKeyBase58;
let zkAppPrivateKeyBase58;
const { feepayerKeyPath } = config.deployAliases[alias];
try {
  feepayerPrivateKeyBase58 = fs.readJSONSync(feepayerKeyPath).privateKey;
} catch (error) {
  log(
    red(
      `  Failed to find the feepayer private key.\n  Please make sure your config.json has the correct 'feepayerKeyPath' property.`
    )
  );

  process.exit(1);
}
try {
  zkAppPrivateKeyBase58 = fs.readJSONSync(
    `${DIR}/${config.deployAliases[alias].keyPath}`
  ).privateKey;
} catch (_) {
  log(
    red(
      `  Failed to find the zkApp private key.\n  Please make sure your config.json has the correct 'keyPath' property.`
    )
  );
  process.exit(1);
}

const zkAppPrivateKey = PrivateKey.fromBase58(zkAppPrivateKeyBase58); //  The private key of the zkApp
const zkAppAddress = zkAppPrivateKey.toPublicKey(); //  The public key of the zkApp
const feepayorPrivateKey = PrivateKey.fromBase58(feepayerPrivateKeyBase58); //  The private key of the feepayer
const feepayerAddress = feepayorPrivateKey.toPublicKey(); //  The public key of the feepayer

// Need for the account cache to work
let acc = Types.Account.emptyValue();
acc.publicKey = feepayerAddress;
Mina.Network(graphQLUrl);
addCachedAccount(acc, graphQLUrl);
// console.log('get: ', Mina.getAccount(feepayerAddress).publicKey.toBase58());

// const { verificationKey } = await step(
//   'Calculating verification key',
//   async () => {
//     // compute a hash of the contract's circuit to determine if 'zkapp.compile' should re-run or cached verfification key can be used
//     let cache = fs.readJsonSync(`${DIR}/build/cache.json`);
//     if (!cache['GameOfLife']) {
//       cache['GameOfLife'] = { digest: '', verificationKey: '' };
//     }
//     if (!cache['GameOfLifeZkProgram']) {
//       cache['GameOfLifeZkProgram'] = { digest: '', verificationKey: '' };
//     }

//     let currentGameOfLifeDigest = await GameOfLife.digest();
//     let currentGameOfLifeZkProgramDigest = await GameOfLifeZkProgram.digest();
//     //check if hash of the contract's circuit is the same as the one in cache
//     if (
//       cache['GameOfLife'].digest === currentGameOfLifeDigest &&
//       cache['GameOfLifeZkProgram'].digest === currentGameOfLifeZkProgramDigest
//     ) {
//       //use cached verification key
//       log('  Using the cached verification key');
//       return cache['GameOfLife'].verificationKey;
//     } else {
//       log('  Generating a new verification key takes 10-30 sec');
//       // Need to complile dependency contracts first
//       const zkProgramVKey = (await GameOfLifeZkProgram.compile())
//         .verificationKey;
//       log(' GameOfLifeZkProgram verification key generated');
//       let zkAppKey = (await GameOfLife.compile()).verificationKey;
//       // update cache with new verification key and currrentDigest
//       cache['GameOfLife'].verificationKey = zkAppKey;
//       cache['GameOfLife'].digest = currentGameOfLifeDigest;
//       cache['GameOfLifeZkProgram'].verificationKey = zkProgramVKey;
//       cache['GameOfLifeZkProgram'].digest = currentGameOfLifeZkProgramDigest;
//       fs.writeJsonSync(`${DIR}/build/cache.json`, cache, {
//         spaces: 2,
//       });
//       return zkAppKey;
//     }
//   }
// );

let { fee } = config.deployAliases[alias];
if (!fee) {
  log(
    red(
      `  The "fee" property is not specified for this deploy alias in config.json. Please update your config.json and try again.`
    )
  );
  process.exit(1);
}
fee = `${Number(fee) * 1e9}`; // in nanomina (1 billion = 1.0 mina)

const feepayerAddressBase58 = feepayerAddress.toBase58();
const accountQuery = getAccountQuery(feepayerAddressBase58);
const accountResponse = await sendGraphQL(graphQLUrl, accountQuery);
if (!accountResponse?.data?.account) {
  // No account is found, show an error message and return early
  log(
    red(
      `  Failed to find the fee payer's account on chain.\n  Please make sure the account "${feepayerAddressBase58}" has previously been funded.`
    )
  );
  process.exit(1);
}

// Build the transaction
let transaction = await step('Build transaction', async () => {
  let Network = Mina.Network(graphQLUrl);
  Mina.setActiveInstance(Network);
  let zkapp = new GameOfLife(zkAppAddress);
  await GameOfLifeZkProgram.compile();
  await GameOfLife.compile();
  let tx = await Mina.transaction({ sender: feepayerAddress, fee }, () => {
    AccountUpdate.fundNewAccount(feepayerAddress);
    log(' GameOfLifeZkProgram verification key generated');
    zkapp.deploy();
  });
  return tx;
});
transaction = await step(
  'Create transaction proof (takes 10-30 sec)',
  async () => {
    await transaction.prove();
    // transaction.sign([zkAppPrivateKey, feepayorPrivateKey]).toJSON();
    return transaction;
  }
);
// Send tx to the relayer.
const txn = await step('Send to network', async () => {
  const zkAppMutation = sendZkAppQuery(
    transaction.sign([zkAppPrivateKey, feepayorPrivateKey]).toJSON()
  );
  try {
    return await sendGraphQL(graphQLUrl, zkAppMutation);
  } catch (error) {
    return error;
  }
});
console.log('txn: ', txn);
if (!txn || txn?.kind === 'error') {
  // Note that the thrown error object is already console logged via step().
  log(red(getErrorMessage(txn)));
  process.exit(1);
}

// console.log('txn: ', txn.data.sendZkapp.zkapp);

const str =
  `\nSuccess! Deploy transaction sent.` +
  `\n` +
  `\nNext step:` +
  `\n  Your smart contract will be live (or updated)` +
  `\n  as soon as the transaction is included in a block:` +
  `\n  ${getTxnUrl(graphQLUrl, txn)}`;

log(green(str));
process.exit(0);

///// Helper functions /////

// Get the specified blockchain explorer url with txn hash
function getTxnUrl(
  graphQLUrl: string | URL,
  txn: { data: { sendZkapp: { zkapp: { hash: any } } } }
) {
  const MINASCAN_BASE_URL = `https://minascan.io/berkeley/zk-transaction/`;
  const MINA_EXPLORER_BASE_URL = `https://berkeley.minaexplorer.com/transaction/`;
  const explorers = [MINASCAN_BASE_URL, MINA_EXPLORER_BASE_URL];
  const randomExplorersIndex = Math.floor(Math.random() * explorers.length);

  const explorerName = new URL(graphQLUrl).hostname
    .split('.')
    .filter((item) => item === 'minascan' || item === 'minaexplorer')?.[0];
  let txnBaseUrl;

  switch (explorerName) {
    case 'minascan':
      txnBaseUrl = MINASCAN_BASE_URL;
      break;
    case 'minaexplorer':
      txnBaseUrl = MINA_EXPLORER_BASE_URL;
      break;
    default:
      // An explorer will be randomly selected from the available explorers if the developer doesn't specify
      txnBaseUrl = explorers[randomExplorersIndex];
      break;
  }

  return `${txnBaseUrl}${txn.data.sendZkapp.zkapp.hash}`;
}

async function sendGraphQL(graphQLUrl: RequestInfo, query: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, 20000); // Default to use 20s as a timeout
  let response;
  try {
    let body = JSON.stringify({ operationName: null, query, variables: {} });
    response = await fetch(graphQLUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    const responseJson = await response.json();
    if (!response.ok || responseJson?.errors) {
      return {
        kind: 'error',
        statusCode: response.status,
        statusText: response.statusText,
        message: responseJson.errors,
      };
    }
    return responseJson;
  } catch (error) {
    clearTimeout(timer);
    return {
      kind: 'error',
      message: error,
    };
  }
}

function sendZkAppQuery(accountUpdatesJson: any) {
  return `
  mutation {
    sendZkapp(input: {
      zkappCommand: ${removeJsonQuotes(accountUpdatesJson)}
    }) { zkapp
      {
        id
        hash
        failureReason {
          index
          failures
        }
      }
    }
  }`;
}

function getAccountQuery(publicKey: any) {
  return `
  query {
    account(publicKey: "${publicKey}") {
      nonce
    }
  }`;
}

function getErrorMessage(error: { message: any }) {
  let errors = error?.message;
  if (!Array.isArray(errors)) {
    return `Failed to send transaction. Unknown error: ${util.format(error)}`;
  }
  let errorMessage =
    '  Failed to send transaction to relayer. Errors: ' +
    errors.map((e) => e.message);
  for (const error of errors) {
    if (error.message.includes('Invalid_nonce')) {
      errorMessage = `  Failed to send transaction to the relayer. An invalid account nonce was specified. Please try again.`;
      break;
    }
  }
  return errorMessage;
}

function removeJsonQuotes(json: string) {
  // source: https://stackoverflow.com/a/65443215
  let cleaned = JSON.stringify(JSON.parse(json), null, 2);
  return cleaned.replace(/^[\t ]*"[^:\n\r]+(?<!\\)":/gm, (match) =>
    match.replace(/"/g, '')
  );
}

async function step(str: string, fn: () => Promise<any>) {
  // discardStdin prevents Ora from accepting input that would be passed to a
  // subsequent command, like a y/n confirmation step, which would be dangerous.
  const spin = ora({ text: `${str}...`, discardStdin: true }).start();
  try {
    const result = await fn();
    spin.succeed(green(str));
    return result;
  } catch (err: any) {
    spin.fail(str);
    console.error('  ' + red(err)); // maintain expected indentation
    console.log(err);
    process.exit(1);
  }
}
