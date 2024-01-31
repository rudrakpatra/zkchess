import {
  AccountUpdate,
  Field,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
} from 'o1js';

import { Chess } from './Chess.js';
import { Move } from './Move/Move.js';
import { GameResult, GameState } from './GameState/GameState.js';

const proofsEnabled = true;

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
    console.log(Chess.analyzeMethods());
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
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
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

  it('halfmove', async () => {
    await localDeploy();

    const txn = await Mina.transaction(whitePlayerAccount, () => {
      zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
    });
    await txn.prove();
    await txn.sign([whitePlayerKey]).send();
    console.log(zkApp.getGameState().toAscii());

    const moves = [
      ['b1', 'c3'],
      ['b8', 'c6'],
      ['e2', 'e3'],
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
  });

  // it('enpassant', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
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
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
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
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
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
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
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

  // it('checkmate but stalemate-pretend', async () => {
  //   await localDeploy();

  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, GameState.fromFEN());
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

  //   const moves = [
  //     ['f2', 'f3'],
  //     ['e7', 'e6'],
  //     ['g2', 'g4'],
  //     ['d8', 'h4'], //check mate by queen
  //     //white claims a stalemate
  //     //black responds by checkmate
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
  //   const whiteClaimsStalemate = await Mina.transaction(
  //     whitePlayerAccount,
  //     () => {
  //       // zkApp.interact(Field(Chess.CLAIM_STALEMATE), Move.INVALID);
  //       zkApp.claimStalemate();
  //     }
  //   );
  //   await whiteClaimsStalemate.prove();
  //   await whiteClaimsStalemate.sign([whitePlayerKey]).send();

  //   const blackPlayerCheckmates = await Mina.transaction(
  //     blackPlayerAccount,
  //     () => {
  //       const move = Move.fromLAN('h4', 'e1');
  //       // zkApp.interact(Field(Chess.OVERRIDE_STALEMATE_CLAIM_BY_KING_CAPTURE),move);
  //       zkApp.overrideStalemateClaimByCapturingKing(move);
  //     }
  //   );
  //   await blackPlayerCheckmates.prove();
  //   await blackPlayerCheckmates.sign([blackPlayerKey]).send();

  //   //check if black wins
  //   Provable.log(zkApp.getGameState().result.equals(GameResult.BLACK_WINS));
  // });

  // it('real stalemate', async () => {
  //   const fen = '4k3/4p1K1/4N3/6R1/8/8/8/8 w - - 0 1';
  //   const intialGameState = GameState.fromFEN(fen);
  //   await localDeploy();
  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     //this function is likely to be removed and used for testing only
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, intialGameState);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

  //   const moves = [
  //     ['g5', 'd5'], //white player rook from g5 to d5 leading stalemate
  //     //black claims stalemate
  //     //white accepts stalemate like a good sport
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
  //   const blackClaimsStalemate = await Mina.transaction(
  //     blackPlayerAccount,
  //     () => {
  //       // zkApp.interact(Field(Chess.CLAIM_STALEMATE), Move.INVALID);
  //       zkApp.claimStalemate();
  //     }
  //   );
  //   await blackClaimsStalemate.prove();
  //   await blackClaimsStalemate.sign([blackPlayerKey]).send();

  //   const whitePlayerAck = await Mina.transaction(whitePlayerAccount, () => {
  //     // zkApp.interact(Field(Chess.ACKNOWLEDGE_STALEMATE_CLAIM), Move.INVALID);
  //     zkApp.acknowledgeStalemateClaim();
  //   });
  //   await whitePlayerAck.prove();
  //   await whitePlayerAck.sign([whitePlayerKey]).send();

  //   //check if draw by stalemate
  //   Provable.log(
  //     zkApp.getGameState().result.equals(GameResult.DRAW_BY_STALEMATE)
  //   );
  // });

  // it('real stalemate with defence', async () => {
  //   const fen = '4k3/4p1K1/4N3/6R1/8/8/8/8 w - - 0 1';
  //   const intialGameState = GameState.fromFEN(fen);
  //   await localDeploy();
  //   const txn = await Mina.transaction(whitePlayerAccount, () => {
  //     //this function is likely to be removed and used for testing only
  //     zkApp.start(whitePlayerAccount, blackPlayerAccount, intialGameState);
  //   });
  //   await txn.prove();
  //   await txn.sign([whitePlayerKey]).send();
  //   console.log(zkApp.getGameState().toAscii());

  //   const moves = [
  //     ['g5', 'd5'], //white player rook from g5 to d5 leading stalemate
  //     //black claims stalemate
  //     //white denies stalemate with a black's move that looks valid
  //     //black shows that the move is invalid as white can now capture the king
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
  //   const blackClaimsStalemate = await Mina.transaction(
  //     blackPlayerAccount,
  //     () => {
  //       // zkApp.interact(Field(Chess.CLAIM_STALEMATE), Move.INVALID);
  //       zkApp.claimStalemate();
  //     }
  //   );
  //   await blackClaimsStalemate.prove();
  //   await blackClaimsStalemate.sign([blackPlayerKey]).send();
  //   Provable.log(
  //     'black claimed stalemate',
  //     zkApp
  //       .getGameState()
  //       .result.equals(GameResult.ONGOING_AND_STALEMATE_CLAIMED)
  //   );
  //   const whitePlayerFalseReport = await Mina.transaction(
  //     whitePlayerAccount,
  //     () => {
  //       const move = Move.fromLAN('e8', 'd8');
  //       // zkApp.interact(
  //       //   Field(Chess.REPORT_STALEMATE_CLAIM_BY_VALID_OPPONENT_MOVE),
  //       //   move
  //       // );
  //       zkApp.reportStalemateClaimByValidOpponentMove(move);
  //     }
  //   );
  //   await whitePlayerFalseReport.prove();
  //   await whitePlayerFalseReport.sign([whitePlayerKey]).send();

  //   Provable.log(
  //     'white false report',
  //     zkApp.getGameState().result.equals(GameResult.STALEMATE_CLAIM_REPORTED)
  //   );

  //   const blackPlayerDefendStalemate = await Mina.transaction(
  //     blackPlayerAccount,
  //     () => {
  //       const move = Move.fromLAN('d5', 'd8');
  //       // zkApp.interact(
  //       //   Field(Chess.DEFEND_STALEMATE_CLAIM),
  //       //   move
  //       // );
  //       zkApp.defendStalemateClaim(move);
  //     }
  //   );

  //   await blackPlayerDefendStalemate.prove();
  //   await blackPlayerDefendStalemate.sign([blackPlayerKey]).send();
  //   //check if draw by stalemate
  //   Provable.log(
  //     zkApp.getGameState().result.equals(GameResult.DRAW_BY_STALEMATE)
  //   );
  // });
});
