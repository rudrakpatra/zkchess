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
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  beforeEach(async () => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } =
      Local.testAccounts[1]);
    ({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } =
      Local.testAccounts[2]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new ChessContract(zkAppAddress);
    await localDeploy();
  });

  it.skip('enableRankings', async () => {
    const txn = await Mina.transaction(whitePlayerAccount, () => {
      AccountUpdate.fundNewAccount(whitePlayerAccount);
      zkApp.enableRankings();
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    expect(zkApp.getPlayerRating(whitePlayerAccount).toBigInt()).toBe(
      BigInt(1200 * 10 ** DEFAULT_PRECISION)
    );
  });

  it.skip('cannot enable rankings without funding', async () => {
    try {
      const txn = await Mina.transaction(whitePlayerAccount, () => {
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
    //WHITE Enables Rankings
    const txn1 = await Mina.transaction(whitePlayerAccount, () => {
      AccountUpdate.fundNewAccount(whitePlayerAccount, 1); // ideally all should already have token accounts
      zkApp.enableRankings();
    });
    await txn1.prove();
    await txn1.sign([whitePlayerKey]).send();
    console.log(zkApp.getPlayerRating(whitePlayerAccount).toBigInt());

    //BLACK Enables Rankings
    const txn2 = await Mina.transaction(blackPlayerAccount, () => {
      AccountUpdate.fundNewAccount(blackPlayerAccount, 1); // ideally all should already have token accounts
      zkApp.enableRankings();
    });
    await txn2.prove();
    await txn2.sign([blackPlayerKey]).send();

    console.log(zkApp.getPlayerRating(blackPlayerAccount).toBigInt());

    const initialGameState = GameState.fromFEN();
    const finalGameState = GameState.fromFEN();
    finalGameState.result = Field(GameResult.WHITE_WINS);

    //WHITE SENDS A DUMMY PROOF
    const rollupstate = RollupState.from(
      initialGameState,
      whitePlayerAccount,
      blackPlayerAccount
    );
    const proof = await PvPChessProgramProof.dummy(
      rollupstate,
      finalGameState,
      2
    );

    const txn3 = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.submitMatchResult(proof);
    });
    await txn3.prove();
    console.log(blackPlayerAccount.toBase58(), whitePlayerAccount.toBase58());
    await txn3.sign([zkAppPrivateKey, whitePlayerKey]).send();
    const whiteRating = zkApp.getPlayerRating(whitePlayerAccount).toBigInt();
    expect(whiteRating).toBe(BigInt(1210 * 10 ** DEFAULT_PRECISION));
  });

  // it('starts the game and resigns', async () => {
  //   await localDeploy();
  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     AccountUpdate.fundNewAccount(whitePlayerAccount, 2); // ideally all should already have token accounts
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());
  //   // white player resigns
  //   const txn2 = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.resign();
  //   });
  //   await txn2.prove();
  //   await txn2.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());
  //   // winners rating should increase by 10
  //   console.log(
  //     zkApp.getPlayerRating(whitePlayerAccount).toBigInt() / 10n ** 10n
  //   );
  //   expect(
  //     //white player rating -=10
  //     zkApp.getPlayerRating(whitePlayerAccount).toBigInt() / 10n ** 10n
  //   ).toBe(1190n);
  //   console.log(
  //     zkApp.getPlayerRating(blackPlayerAccount).toBigInt() / 10n ** 10n
  //   );
  //   expect(
  //     //black player rating +=10
  //     zkApp.getPlayerRating(blackPlayerAccount).toBigInt() / 10n ** 10n
  //   ).toBe(1210n);
  // });

  // it('start game twice', async () => {
  //   await localDeploy();
  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     AccountUpdate.fundNewAccount(whitePlayerAccount, 2); // ideally all should already have token accounts
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

  //   const txn2 = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.move(Move.fromLAN('b1', 'a3'));
  //   });
  //   await txn2.prove();
  //   await txn2.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

  //   const txn3 = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
  //   });
  //   await txn3.prove();
  //   await txn3.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());
  // });
});
