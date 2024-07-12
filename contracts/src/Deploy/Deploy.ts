import {
  Mina,
  PrivateKey,
  PublicKey,
  fetchAccount,
  AccountUpdate,
} from 'o1js';
import { PvPChessProgram } from '../PvPChessProgram/PvPChessProgram.js';
import { ChessContract} from '../ChessContract/ChessContract.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();


/**
 * node build/src/Deploy/Deploy.js
 */

const MINAURL = 'https://proxy.devnet.minaexplorer.com/graphql';
const ARCHIVEURL = 'https://archive.devnet.minaexplorer.com';
const MINAEXPLORER = 'https://minascan.io/berkeley/account/';

const FEE_PAYER_PRIVATE_KEY = process.env.FEE_PAYER_PRIVATE_KEY as string;
if(!FEE_PAYER_PRIVATE_KEY ){
  console.error("Please set the environment variables FEE_PAYER_PRIVATE_KEY");
  process.exit(1);
}

const GAS_FEES = 100_000_000;

function generateAccount() {
  const zkAppPrivateKey = PrivateKey.random();
  const zkAppPrivateKeyString = PrivateKey.toBase58(zkAppPrivateKey);
  const zkAppAddress = zkAppPrivateKey.toPublicKey();
  const zkAppAddressString = PublicKey.toBase58(zkAppAddress);

  return {
    privateKey: zkAppPrivateKeyString,
    publicKey: zkAppAddressString,
    explorer: `${MINAEXPLORER}${zkAppAddressString}`,
  };
}

async function topupAccount(publicKey: string) {
  // this is not working for some reason
  // await Mina.faucet(PublicKey.fromBase58(publicKey), 'devnet');
  console.log(
    `request funds using https://faucet.minaprotocol.com/?address=${publicKey}`
  );
}

async function accountBalance(publicKey: string) {
  const address = PublicKey.fromBase58(publicKey);
  let check = Mina.hasAccount(address);
  //console.log("check1", check);
  if (!check) {
    await fetchAccount({ publicKey: address });
    check = Mina.hasAccount(address);
    //console.log("check2", check);
    if (!check) return 0;
  }
  const balance = Mina.getBalance(address);
  return balance.toBigInt();
}

async function minaInit() {
  const Network = Mina.Network({
    mina: MINAURL,
    archive: ARCHIVEURL,
  });
  Mina.setActiveInstance(Network);
  console.log('o1js loaded');
}

async function deploy() {
  await minaInit();
  const acc = generateAccount();
  // get Balance of FEE_PAYER_PRIVATE_KEY
  const feePayer = PrivateKey.fromBase58(FEE_PAYER_PRIVATE_KEY).toPublicKey();
  const feePayerBal = await accountBalance(feePayer.toBase58());
  if (feePayerBal === 0) {
    await topupAccount(feePayer.toBase58());
  }

  const zkapp = new ChessContract(PublicKey.fromBase58(acc.publicKey));

  while (true) {
    try {
      const balance = await accountBalance(feePayer.toBase58());
      if (balance !== 0) {
        // deploy zkapp
        console.log(
          `Using zkApp\nprivateKey:\t${acc.privateKey}\npublicKey:\t${acc.publicKey}`
        );
        //store zkApp Public Key in file
        fs.writeFileSync('cache/zkAppPublicKey.json', JSON.stringify(acc.publicKey));
        const txn1 = await Mina.transaction(
          { sender: feePayer, fee: GAS_FEES },
          async () => {
            AccountUpdate.fundNewAccount(feePayer);
            await zkapp.deploy();
          }
        );
        await txn1.prove();
        console.log('proved!...');
        txn1.sign([
          PrivateKey.fromBase58(FEE_PAYER_PRIVATE_KEY),
          PrivateKey.fromBase58(acc.privateKey),
        ]);
        const res = await txn1.send();
        if (res.status === 'rejected') {
          console.log('error sending transaction');
        } else {
          console.log(
            'See deploy transaction at',
            `https://minascan.io/devnet/tx/${res.hash}`
          );
          console.log('waiting for zkApp account to be deployed...');
          await res.wait();
          return;
        }
      } else {
        const delay: number = 1000 + Math.floor(Math.random() * 500);
        await sleep(delay);
      }
    } catch (error: any) {
      console.log('retrying...', error);
      await sleep(1000 * 60);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// console.log(generateAccount());

const t = Date.now();
const PvPChessProgram_vkey = (await PvPChessProgram.compile()).verificationKey;
const ChessContract_vkey = (await ChessContract.compile()).verificationKey;
// store vkey in file for caching
// fs.writeFileSync('cache/PvPChessProgram_vkey.json', JSON.stringify(PvPChessProgram_vkey));
// fs.writeFileSync('cache/ChessContract_vkey.json', JSON.stringify(ChessContract_vkey));

console.log(`Compiling done in ${(Date.now() - t) / 1000}s`);

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});