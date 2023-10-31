import {
  AccountUpdate,
  Bool,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  UInt32,
} from 'o1js';

import { Chess, Path } from './Chess.js';
import { Position } from './Board/Position/Position.js';
import { RANKS } from './Board/Piece/Piece.js';

const proofsEnabled = false;
describe('Chess.ts', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    whitePlayerAccount: PublicKey,
    whitePlayerKey: PrivateKey,
    blackPlayerAccount: PublicKey,
    blackPlayerKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Chess;

  beforeAll(async () => {
    if (proofsEnabled) await Chess.compile();
  });

  beforeEach(() => {
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
    zkApp = new Chess(zkAppAddress);
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

  // it('starts the game', async () => {
  //   await localDeploy();
  //   zkApp.startGame(whitePlayerAccount, blackPlayerAccount);
  // });

  it('starts and moves', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getBoard().display());
    const txn2 = await Mina.transaction(whitePlayerAccount, () => {
      const p0 = Position.from(7, 1);
      const p1 = Position.from(6, 1);
      const p2 = Position.from(5, 0);
      const path = Path.from([p0, p0, p0, p0, p0, p0, p1, p2]);
      zkApp.move(path, Field(RANKS.QUEEN)); // play the left knight out
    });
    await txn2.prove();
    await txn2.sign([whitePlayerKey]).send();
    console.log(zkApp.getBoard().display());

    const txn3 = await Mina.transaction(blackPlayerAccount, () => {
      const p0 = Position.from(0, 6);
      const p1 = Position.from(1, 6);
      const p2 = Position.from(2, 5);
      const path = Path.from([p0, p0, p0, p0, p0, p0, p1, p2]);
      zkApp.move(path, Field(RANKS.QUEEN)); // play the right knight out
    });
    await txn3.prove();
    await txn3.sign([blackPlayerKey]).send();
    console.log(zkApp.getBoard().display());

    const txn4 = await Mina.transaction(whitePlayerAccount, () => {
      const p0 = Position.from(6, 2);
      const p1 = Position.from(5, 2);
      const p2 = Position.from(4, 2);
      const path = Path.from([p0, p0, p0, p0, p0, p0, p1, p2]);
      zkApp.move(path, Field(RANKS.QUEEN)); //play the pawn
    });
    await txn4.prove();
    await txn4.sign([whitePlayerKey]).send();
    console.log(zkApp.getBoard().display());
  });
});
