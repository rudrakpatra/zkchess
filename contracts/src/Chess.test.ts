// import { Chess.ts } from './Chess.ts';

import { AccountUpdate, Field, Mina, PrivateKey, PublicKey, UInt32 } from "o1js";
import { ChessGame, Position } from "./Chess.js";

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
  zkApp: ChessGame;

  beforeAll(async () => {
    if (proofsEnabled) await ChessGame.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
    ({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } = Local.testAccounts[1]);
    ({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } = Local.testAccounts[2]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new ChessGame(zkAppAddress);
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
  //   // zkApp.move(UInt32.from(0),Position.from(0,1));
  // });
  it('starts and moves', async () => {
    await localDeploy();
    zkApp.startGame(whitePlayerAccount, blackPlayerAccount);
    zkApp.getBoard().display();
    // zkApp.move(UInt32.from(0),Position.from(0,1));
    // console.log(Field(5).toBigInt());
    // console.log(Field(5).toBits(6));
    // console.log(Field(5).toBits(6).map((x) => x.toString()));
  });
});
