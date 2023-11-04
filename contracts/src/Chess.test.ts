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

  // it('starts the game and resigns', async () => {
  //   await localDeploy();
  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());
  //   const txn2 = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.resign();
  //   });
  //   await txn2.prove();
  //   await txn2.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());
  // });

  // it('start game twice', async () => {
  //   await localDeploy();
  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());

  //   const txn2 = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.move(ChessMove.fromLAN('b1', 'a3'));
  //   });
  //   await txn2.prove();
  //   await txn2.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());

  //   const txn3 = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn3.prove();
  //   await txn3.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());
  // });

  // it('halfmove', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());

  //   const moves = [
  //     ['b1', 'c3'],
  //     ['b8', 'c6'],
  //     ['e2', 'e3'],
  //   ];
  //   for (let i = 0; i < moves.length; i++) {
  //     const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
  //     const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
  //     console.log(moves[i][0], moves[i][1]);
  //     const txn2 = await Mina.transaction(player, () => {
  //       zkApp.move(ChessMove.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toString());
  //   }
  // });

  // it('enpassant', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());

  //   const moves = [
  //     ['e2', 'e4'],
  //     ['d7', 'd5'],
  //     ['e4', 'd5'],
  //     ['e7', 'e5'],
  //     ['d5', 'e6'],
  //   ];
  //   for (let i = 0; i < moves.length; i++) {
  //     const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
  //     const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
  //     console.log(moves[i][0], moves[i][1]);
  //     const txn2 = await Mina.transaction(player, () => {
  //       zkApp.move(ChessMove.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toString());
  //   }
  // });

  // it('castling', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toString());

  //   const moves = [
  //     ['e2', 'e4'],
  //     ['c7', 'c6'],
  //     ['f1', 'b5'],
  //     ['c6', 'b5'],
  //     ['g1', 'e2'],
  //     ['b5', 'b4'],
  //     ['e1', 'g1'],
  //   ];
  //   for (let i = 0; i < moves.length; i++) {
  //     const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
  //     const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
  //     console.log(moves[i][0], moves[i][1]);
  //     const txn2 = await Mina.transaction(player, () => {
  //       zkApp.move(ChessMove.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toString());
  //   }
  // });

  it('promotion', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toString());

    const moves = [
      ['b2', 'b4'],
      ['c7', 'c6'],
      ['b4', 'b5'],
      ['c6', 'c5'],
      ['b5', 'b6'],
      ['c5', 'c4'],
      ['b6', 'a7'],
      ['c4', 'c3'],
      ['a7', 'b8'],
    ];
    for (let i = 0; i < moves.length; i++) {
      const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
      const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
      console.log(moves[i][0], moves[i][1]);
      const txn2 = await Mina.transaction(player, () => {
        zkApp.move(ChessMove.fromLAN(moves[i][0], moves[i][1], 'r'));
      });
      await txn2.prove();
      await txn2.sign([key]).send();
      console.log(zkApp.getGameState().toString());
    }
  });
});
