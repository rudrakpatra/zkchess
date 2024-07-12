import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
} from 'o1js';

import { ChessContract } from './ChessContract.js';
import { GameResult, GameState } from '../GameState/GameState.js';
import { DEFAULT_DECIMALS } from '../EloRating/EloRating.js';
import {
  PvPChessProgram,
  PvPChessProgramProof,
  RollupState,
} from '../PvPChessProgram/PvPChessProgram.js';

const proofsEnabled = false;

describe('ChessContract', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    whitePlayerAccount: PublicKey,
    whitePlayerKey: PrivateKey,
    blackPlayerAccount: PublicKey,
    blackPlayerKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ChessContract;

  beforeAll(async () => {
    console.log(
      Object.values(await ChessContract.analyzeMethods()).reduce(
        (acc, method) => acc + method.rows,
        0
      ) + ' total rows'
    );
    console.time('compiled');
    if (proofsEnabled) {
      await PvPChessProgram.compile();
      await ChessContract.compile();
    }
    console.timeEnd('compiled');
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    deployerKey = Local.testAccounts[0].key;
    deployerAccount = deployerKey.toPublicKey();
    whitePlayerKey = Local.testAccounts[1].key;
    whitePlayerAccount = whitePlayerKey.toPublicKey();
    blackPlayerKey = Local.testAccounts[2].key;
    blackPlayerAccount = blackPlayerKey.toPublicKey();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new ChessContract(zkAppAddress);
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  });
  it('enableRankings', async () => {
    const txn = await Mina.transaction(whitePlayerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.enableRankings();
    });
    await txn.prove();
    await txn.sign([whitePlayerKey, deployerKey]).send();
    expect(
      Mina.getBalance(whitePlayerAccount, zkApp.deriveTokenId()).toBigInt()
    ).toBe(BigInt(1200 * 10 ** DEFAULT_DECIMALS));
  });
  it('submitMatchResult', async () => {
    //Once upon a time, in a land far far away, there were two players, White and Black
    const txn1 = await Mina.transaction(whitePlayerAccount, async () => {
      AccountUpdate.fundNewAccount(whitePlayerAccount); // ideally all should already have token accounts
      zkApp.enableRankings();
    });
    await txn1.prove();
    await txn1.sign([whitePlayerKey]).send();
    //white player should now have a rating of 1200
    expect(zkApp.getPlayerRating(whitePlayerAccount).toBigInt()).toBe(
      BigInt(1200 * 10 ** DEFAULT_DECIMALS)
    );

    //same for black player
    const txn2 = await Mina.transaction(blackPlayerAccount, async () => {
      AccountUpdate.fundNewAccount(blackPlayerAccount); // ideally all should already have token accounts
      zkApp.enableRankings();
    });
    await txn2.prove();
    await txn2.sign([blackPlayerKey]).send();

    expect(zkApp.getPlayerRating(blackPlayerAccount).toBigInt()).toBe(
      BigInt(1200 * 10 ** DEFAULT_DECIMALS)
    );

    //now before they play they create their proxies that play on their behalf
    const whiteProxy = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    //WHITE SENDS A DUMMY PROOF THAT CONTAINS THE RESULT THAT WHITE WON

    const initialGameState = GameState.fromFEN();
    const finalGameState = GameState.fromFEN();
    finalGameState.result = Field(GameResult.WHITE_WINS);

    const rollupstate = RollupState.from(
      initialGameState,
      whitePlayerAccount,
      whiteProxy.toPublicKey(),
      blackPlayerAccount,
      blackProxy.toPublicKey()
    );
    const proof = await PvPChessProgramProof.dummy(
      rollupstate,
      finalGameState,
      2
    );
    const txn3 = await Mina.transaction(whitePlayerAccount, async () => {
      zkApp.submitMatchResult(proof);
    });
    await txn3.prove();
    await txn3.sign([whitePlayerKey, blackPlayerKey]).send();
    const whiteRating = zkApp.getPlayerRating(whitePlayerAccount).toBigInt();
    expect(whiteRating).toBe(BigInt(1210 * 10 ** DEFAULT_DECIMALS));
  });
});
