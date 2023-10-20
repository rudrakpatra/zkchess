// import { Chess.ts } from './Chess.ts';

import { AccountUpdate, Mina, PrivateKey, PublicKey } from "o1js";
import { ChessGame } from "./Chess.js";

const proofsEnabled = true;
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

  it('generates and deploys the `chessGame` smart contract', async () => {
    await localDeploy();
    zkApp.startGame(whitePlayerAccount, blackPlayerAccount);
    // zkApp.moveKing(
  });
});
