import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
} from 'o1js';

import { ChessContract } from './ChessContract.js';
import { Move } from '../Move/Move.js';
import { GameResult, GameState } from '../GameState/GameState.js';
import { DEFAULT_PRECISION } from '../EloRating/EloRating.js';
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
      Object.values(ChessContract.analyzeMethods()).reduce(
        (acc, method) => acc + method.rows,
        0
      ) + ' total rows'
    );
    if (proofsEnabled) await ChessContract.compile();
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

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
    await localDeploy();
  });

  it('enableRankings', async () => {
    const txn = await Mina.transaction(whitePlayerAccount, async () => {
      AccountUpdate.fundNewAccount(whitePlayerAccount);
      zkApp.enableRankings();
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    expect(zkApp.getPlayerRating(whitePlayerAccount).toBigInt()).toBe(
      BigInt(1200 * 10 ** DEFAULT_PRECISION)
    );
  });

  it('cannot enable rankings without funding', async () => {
    try {
      const txn = await Mina.transaction(whitePlayerAccount, async () => {
        zkApp.enableRankings();
      });
      await txn.prove();
      await txn.sign([whitePlayerKey]).send();
    } catch (e) {
      expect(
        (e as Error).message.startsWith('Invalid fee excess.')
      ).toBeTruthy();
    }
  });
  it('submitMatchResult', async () => {
    //Once upon a time, in a land far far away, there were two players, White and Black
    const txn1 = await Mina.transaction(whitePlayerAccount, async () => {
      AccountUpdate.fundNewAccount(whitePlayerAccount, 1); // ideally all should already have token accounts
      zkApp.enableRankings();
    });
    await txn1.prove();
    await txn1.sign([whitePlayerKey]).send();
    //white player should now have a rating of 1200
    console.log(zkApp.getPlayerRating(whitePlayerAccount).toBigInt());

    //same for black player
    const txn2 = await Mina.transaction(blackPlayerAccount, async () => {
      AccountUpdate.fundNewAccount(blackPlayerAccount, 1); // ideally all should already have token accounts
      zkApp.enableRankings();
    });
    await txn2.prove();
    await txn2.sign([blackPlayerKey]).send();

    console.log(zkApp.getPlayerRating(blackPlayerAccount).toBigInt());

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
      blackPlayerAccount,
      whiteProxy.toPublicKey(),
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
    console.log(blackPlayerAccount.toBase58(), whitePlayerAccount.toBase58());
    await txn3.sign([zkAppPrivateKey, whitePlayerKey]).send();
    const whiteRating = zkApp.getPlayerRating(whitePlayerAccount).toBigInt();
    expect(whiteRating).toBe(BigInt(1210 * 10 ** DEFAULT_PRECISION));
  });
});
