import {
    AccountUpdate,
    fetchAccount,
    Field,
    Mina,
    PrivateKey,
    Provable,
    PublicKey,
  } from 'o1js';
  
import { ChessContract } from '../ChessContract/ChessContract.js';
import { GameResult, GameState } from '../GameState/GameState.js';
import { DEFAULT_DECIMALS } from '../EloRating/EloRating.js';
import {
  PvPChessProgram,
  PvPChessProgramProof,
  RollupState,
} from '../PvPChessProgram/PvPChessProgram.js';

import dotenv from 'dotenv';
dotenv.config();
/**
 * node build/src/Deploy/DeployTest.js
 */
const MINAURL = 'https://proxy.devnet.minaexplorer.com/graphql';
const ARCHIVEURL = 'https://archive.devnet.minaexplorer.com';
const MINAEXPLORER = 'https://minascan.io/berkeley/account/';

const FEE_PAYER_PRIVATE_KEY = process.env.FEE_PAYER_PRIVATE_KEY;
const WHITE_PLAYER_PRIVATE_KEY = process.env.WHITE_PLAYER_PRIVATE_KEY;
const BLACK_PLAYER_PRIVATE_KEY = process.env.BLACK_PLAYER_PRIVATE_KEY;
const ZK_APP_PRIVATE_KEY = process.env.ZK_APP_PRIVATE_KEY;

if(!FEE_PAYER_PRIVATE_KEY || !WHITE_PLAYER_PRIVATE_KEY || !BLACK_PLAYER_PRIVATE_KEY || !ZK_APP_PRIVATE_KEY){
    console.error("Please set the environment variables FEE_PAYER_PRIVATE_KEY, WHITE_PLAYER_PRIVATE_KEY, BLACK_PLAYER_PRIVATE_KEY, ZK_APP_PRIVATE_KEY");
    process.exit(1);
}

const GAS_FEES = 110_000_000;

const proofsEnabled = true;
  
let feePayerAccount: PublicKey,
    feePayerKey: PrivateKey,
    whitePlayerAccount: PublicKey,
    whitePlayerKey: PrivateKey,
    blackPlayerAccount: PublicKey,
    blackPlayerKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ChessContract;

console.log(
Object.values(await ChessContract.analyzeMethods()).reduce(
    (acc, method) => acc + method.rows,
    0
) + ' total rows'
);
console.time('compiled');    
const network = Mina.Network({
    mina: MINAURL,
    archive: ARCHIVEURL,
});
Mina.setActiveInstance(network)
feePayerKey = PrivateKey.fromBase58(FEE_PAYER_PRIVATE_KEY);
feePayerAccount = feePayerKey.toPublicKey();
whitePlayerKey = PrivateKey.fromBase58(WHITE_PLAYER_PRIVATE_KEY);
whitePlayerAccount = whitePlayerKey.toPublicKey();
blackPlayerKey = PrivateKey.fromBase58(BLACK_PLAYER_PRIVATE_KEY);
blackPlayerAccount = blackPlayerKey.toPublicKey();
zkAppPrivateKey = PrivateKey.fromBase58(ZK_APP_PRIVATE_KEY);
zkAppAddress = zkAppPrivateKey.toPublicKey();
zkApp = new ChessContract(zkAppAddress);
if (proofsEnabled) {
// await PvPChessProgram.compile();
// await ChessContract.compile();
}

console.log('Fee payer:', feePayerAccount.toBase58());
console.log('White player:', whitePlayerAccount.toBase58());
console.log('Black player:', blackPlayerAccount.toBase58());
console.log('ZK app:', zkAppAddress.toBase58());

await fetchAccount({ publicKey: feePayerAccount });
await fetchAccount({ publicKey: whitePlayerAccount });
await fetchAccount({ publicKey: blackPlayerAccount });
await fetchAccount({ publicKey: zkAppAddress });


//Once upon a time, in a land far far away, there were two players, White and Black

// const txn1 = await Mina.transaction({ sender: whitePlayerAccount, fee: GAS_FEES }, async () => {
//     AccountUpdate.fundNewAccount(feePayerAccount);
//     zkApp.enableRankings();
// });
// await txn1.prove();
// await txn1.sign([whitePlayerKey,feePayerKey]).send().then(res=>console.log(res));
//receive the  txn hash : 5JuhoEAGBQvtDmcuNPaYzJQuZ7ytSSbebcaoSjwsDNQt2W9DRCgA

//white player should now have a rating of 1200
// console.log(Mina.getBalance(whitePlayerAccount,zkApp.deriveTokenId()).toBigInt());

// //same for black player
// const txn2 = await Mina.transaction({ sender: blackPlayerAccount, fee: GAS_FEES }, async () => {
//     AccountUpdate.fundNewAccount(feePayerAccount);
//     zkApp.enableRankings();
// });
// await txn2.prove();
// await txn2.sign([blackPlayerKey,feePayerKey]).send().then(res=>console.log(res));
//receive the  txn hash : 5JuY7Jp6kxmDiqZzH9mKMcp4rvLzvUgGyGBrHJ3Zo9rGggAMQjLJ

// console.log(Mina.getBalance(blackPlayerAccount,zkApp.deriveTokenId()).toBigInt());
