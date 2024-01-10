import { AccountUpdate, Mina, PrivateKey, Provable, PublicKey } from 'o1js';

import { Chess } from './Chess.js';
import { Move } from './Move/Move.js';
import { GameResult } from './GameState/GameState.js';

const proofsEnabled = false;
describe('Chess', () => {
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
  //   console.log(zkApp.getGameState().toAscii());
  //   const txn2 = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.resign();
  //   });
  //   await txn2.prove();
  //   await txn2.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());
  // });

  // it('start game twice', async () => {
  //   await localDeploy();
  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
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
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn3.prove();
  //   await txn3.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());
  // });

  // it('halfmove', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

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
  //       zkApp.move(Move.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toAscii());
  //   }
  // });

  // it('enpassant', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

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
  //       zkApp.move(Move.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toAscii());
  //   }
  // });

  // it('castling', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

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
  //       zkApp.move(Move.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toAscii());
  //   }
  // });

  // it('promotion', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

  //   const moves = [
  //     ['b2', 'b4'],
  //     ['c7', 'c6'],
  //     ['b4', 'b5'],
  //     ['c6', 'c5'],
  //     ['b5', 'b6'],
  //     ['c5', 'c4'],
  //     ['b6', 'a7'],
  //     ['c4', 'c3'],
  //     ['a7', 'b8'],
  //   ];
  //   for (let i = 0; i < moves.length; i++) {
  //     const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
  //     const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
  //     console.log(moves[i][0], moves[i][1]);
  //     const txn2 = await Mina.transaction(player, () => {
  //       zkApp.move(Move.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toAscii());
  //   }
  // });
  // it('checkmate', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

  //   const moves = [
  //     ['f2', 'f3'],
  //     ['e7', 'e6'],
  //     ['g2', 'g4'],
  //     ['d8', 'h4'], //check mate by queen
  //     ['e1', 'f2'], //white is unable to deflect check
  //     ['h4', 'f2'], //queen captures king
  //   ];
  //   for (let i = 0; i < moves.length; i++) {
  //     const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
  //     const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
  //     console.log(moves[i][0], moves[i][1]);
  //     const txn2 = await Mina.transaction(player, () => {
  //       zkApp.move(Move.fromLAN(moves[i][0], moves[i][1], 'r'));
  //     });
  //     await txn2.prove();
  //     await txn2.sign([key]).send();
  //     console.log(zkApp.getGameState().toAscii());
  //   }
  //   //check if black wins
  //   Provable.log(zkApp.getGameState().result.equals(GameResult.BLACK_WINS));
  // });
  it('checkmate but stalemate-pretend', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toAscii());

    const moves = [
      ['f2', 'f3'],
      ['e7', 'e6'],
      ['g2', 'g4'],
      ['d8', 'h4'], //check mate by queen
      //white claims a stalemate
      //black responds by checkmate
    ];
    for (let i = 0; i < moves.length; i++) {
      const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
      const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
      console.log(moves[i][0], moves[i][1]);
      const txn2 = await Mina.transaction(player, () => {
        zkApp.move(Move.fromLAN(moves[i][0], moves[i][1], 'r'));
      });
      await txn2.prove();
      await txn2.sign([key]).send();
      console.log(zkApp.getGameState().toAscii());
    }
    const whiteClaimsStalemate = await Mina.transaction(
      whitePlayerAccount,
      () => {
        zkApp.claimStalemate();
      }
    );
    await whiteClaimsStalemate.prove();
    await whiteClaimsStalemate.sign([whitePlayerKey]).send();

    const blackPlayerCheckmates = await Mina.transaction(
      blackPlayerAccount,
      () => {
        zkApp.overrideStalemateClaimByCapturingKing(Move.fromLAN('h4', 'e1'));
      }
    );
    await blackPlayerCheckmates.prove();
    await blackPlayerCheckmates.sign([blackPlayerKey]).send();

    //check if black wins
    Provable.log(zkApp.getGameState().result.equals(GameResult.BLACK_WINS));
  });
  it('real stalemate', async () => {
    await localDeploy();
    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount);
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toAscii());

    const moves = [
      ['f2', 'f3'],
      ['e7', 'e6'],
      ['g2', 'g4'],
      ['d8', 'h4'], //check mate by queen
      //white claims a stalemate
      //black responds by checkmate
    ];
    for (let i = 0; i < moves.length; i++) {
      const player = i % 2 == 0 ? whitePlayerAccount : blackPlayerAccount;
      const key = i % 2 == 0 ? whitePlayerKey : blackPlayerKey;
      console.log(moves[i][0], moves[i][1]);
      const txn2 = await Mina.transaction(player, () => {
        zkApp.move(Move.fromLAN(moves[i][0], moves[i][1], 'r'));
      });
      await txn2.prove();
      await txn2.sign([key]).send();
      console.log(zkApp.getGameState().toAscii());
    }
    const whiteClaimsStalemate = await Mina.transaction(
      whitePlayerAccount,
      () => {
        zkApp.claimStalemate();
      }
    );
    await whiteClaimsStalemate.prove();
    await whiteClaimsStalemate.sign([whitePlayerKey]).send();

    const blackPlayerCheckmates = await Mina.transaction(
      blackPlayerAccount,
      () => {
        zkApp.overrideStalemateClaimByCapturingKing(Move.fromLAN('h4', 'e1'));
      }
    );
    await blackPlayerCheckmates.prove();
    await blackPlayerCheckmates.sign([blackPlayerKey]).send();

    //check if black wins
    Provable.log(zkApp.getGameState().result.equals(GameResult.BLACK_WINS));
  });
});
