import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';

import { Chess } from './Chess.js';
import { ChessMove } from './ChessMove.js';
import { RANK } from './Piece/Rank.js';

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
    console.log(zkApp.getGameState().toString());

    const txn2 = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.move(ChessMove.fromLAN('b1', 'a3'));
    });
    await txn2.prove();
    await txn2.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toString());

    const txn3 = await Mina.transaction(blackPlayerAccount, () => {
      zkApp.move(ChessMove.fromLAN('d7', 'd6', 'b'));
    });
    await txn3.prove();
    await txn3.sign([blackPlayerKey]).send();
    console.log(zkApp.getGameState().toString());

    const txn4 = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.move(ChessMove.fromLAN('c2', 'c4'));
    });
    await txn4.prove();
    await txn4.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toString());
  });
});
