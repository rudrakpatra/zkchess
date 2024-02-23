import {
  Field,
  Provable,
  SelfProof,
  ZkProgram,
  PublicKey,
  PrivateKey,
  Struct,
  Signature,
  Bool,
} from 'o1js';
import { GameResult, GameState } from './GameState/GameState.js';
import { Move } from './Move/Move.js';
import { GameObject } from './GameLogic/GameLogic.js';

export class RollupState extends Struct({
  initialGameState: GameState,
  white: PublicKey,
  black: PublicKey,
}) {
  static from(initialGameState: GameState, white: PublicKey, black: PublicKey) {
    return new RollupState({ initialGameState, white, black });
  }
}
/**
 * shows the current `board state` is achieved from a series of valid chess move
 * & the moves performed by the correct player
 */
export const PvPChessProgram = ZkProgram({
  name: 'pvp-chess-zk-program',
  publicInput: RollupState,
  publicOutput: GameState,

  methods: {
    // verify both players aggreed to start the game by verifying
    // their signatures
    start: {
      privateInputs: [Signature, Signature],
      method(
        state: RollupState,
        whitePlayerSignature: Signature,
        blackPlayerSignature: Signature
      ) {
        // TODO include time/block number, game information in signature
        whitePlayerSignature.verify(
          state.white,
          state.initialGameState.toFields()
        );
        blackPlayerSignature.verify(
          state.black,
          state.initialGameState.toFields()
        );
        return state.initialGameState;
      },
    },
    // players need to use their privateKey to prove move is from them
    move: {
      privateInputs: [SelfProof, Move, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        move: Move,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        state.black.assertEquals(earlierProof.publicInput.black);
        state.white.assertEquals(earlierProof.publicInput.white);
        const initialGameStateFields = state.initialGameState.toFields();
        const earlierProofFields =
          earlierProof.publicInput.initialGameState.toFields();
        for (let i = 0; i < 2; i++) {
          initialGameStateFields[i].assertEquals(earlierProofFields[i]);
        }

        const gameState = earlierProof.publicOutput;

        // assert correct player
        Provable.if(gameState.turn, state.white, state.black).assertEquals(
          playerPrivateKey.toPublicKey()
        );

        gameState.result
          .equals(Field(GameResult.ONGOING))
          .assertTrue('game already over');

        const gameObject = new GameObject(gameState);
        gameObject.preMoveValidations(move).assertTrue('invalid move');

        // TODO check why this line causes compile to fail
        // const newGameState = gameObject.toUpdated(move);

        //UPDATE GAME STATE
        return earlierProof.publicOutput;
        // return GameState.from(
        //   newGameState.white,
        //   newGameState.black,
        //   newGameState.turn,
        //   newGameState.enpassant,
        //   newGameState.kingCastled,
        //   newGameState.column,
        //   newGameState.halfmove,
        //   //newGameState.canDraw,
        //   Bool(false),
        //   // newGameState.result
        //   Provable.if(
        //     newGameState.black.getKing().captured,
        //     //WHITE WINS
        //     Field(GameResult.WHITE_WINS),
        //     Provable.if(
        //       newGameState.white.getKing().captured,
        //       //BLACK WINS
        //       Field(GameResult.BLACK_WINS),
        //       //else
        //       Field(GameResult.ONGOING)
        //     )
        //   )
        // );
      },
    },

    offerDraw: {
      privateInputs: [SelfProof, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        state.black.assertEquals(earlierProof.publicInput.black);
        state.white.assertEquals(earlierProof.publicInput.white);
        const initialGameStateFields = state.initialGameState.toFields();
        const earlierProofFields =
          earlierProof.publicInput.initialGameState.toFields();
        for (let i = 0; i < 2; i++) {
          initialGameStateFields[i].assertEquals(earlierProofFields[i]);
        }

        const gameState = earlierProof.publicOutput;
        // assert correct player
        Provable.if(gameState.turn, state.white, state.black).assertEquals(
          playerPrivateKey.toPublicKey()
        );

        gameState.result
          .equals(Field(GameResult.ONGOING))
          .assertTrue('game already over');
        return GameState.from(
          gameState.white,
          gameState.black,
          // gameState.turn,
          gameState.turn.not(),
          gameState.enpassant,
          gameState.kingCastled,
          gameState.column,
          gameState.halfmove,
          //gameState.canDraw,
          Bool(true),
          // gameState.result
          Field(GameResult.ONGOING_OFFERED_DRAW)
        );
      },
    },
    resolveDraw: {
      privateInputs: [SelfProof, Bool,PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        accept: Bool,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        state.black.assertEquals(earlierProof.publicInput.black);
        state.white.assertEquals(earlierProof.publicInput.white);

        const initialGameStateFields = state.initialGameState.toFields();
        const earlierProofFields =
          earlierProof.publicInput.initialGameState.toFields();
        for (let i = 0; i < 2; i++) {
          initialGameStateFields[i].assertEquals(earlierProofFields[i]);
        }

        const gameState = earlierProof.publicOutput;
        // assert correct player
        Provable.if(gameState.turn, state.white, state.black).assertEquals(
            playerPrivateKey.toPublicKey()
        );

        gameState.result
          .equals(Field(GameResult.ONGOING_OFFERED_DRAW))
          .assertTrue('game not in draw state');

        gameState.canDraw.assertTrue('draw not offered');
        //UPDATE GAME STATE
        return GameState.from(
            gameState.white,
            gameState.black,
            // gameState.turn,
            gameState.turn.not(),
            gameState.enpassant,
            gameState.kingCastled,
            gameState.column,
            gameState.halfmove,
            //gameState.canDraw,
            Bool(false),
            // gameState.result
            Provable.if(accept, Field(GameResult.DRAW), Field(GameResult.ONGOING))
          );
      },
    },
    reportIllegalCastling:{
      privateInputs: [SelfProof,Move,PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        move: Move,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        state.black.assertEquals(earlierProof.publicInput.black);
        state.white.assertEquals(earlierProof.publicInput.white);
        const initialGameStateFields = state.initialGameState.toFields();
        const earlierProofFields =
          earlierProof.publicInput.initialGameState.toFields();
        for (let i = 0; i < 2; i++) {
          initialGameStateFields[i].assertEquals(earlierProofFields[i]);
        }

        const gameState = earlierProof.publicOutput;
        // assert correct player
        Provable.if(gameState.turn, state.white, state.black).assertEquals(
          playerPrivateKey.toPublicKey()
        );
        gameState.result
          .equals(Field(GameResult.ONGOING))
          .assertTrue('game already over');
        const gameObject = new GameObject(gameState);
        gameObject
        .illegalCastling(move)
      .assertTrue('false report of illegal castling');

        return GameState.from(
          gameState.white,
          gameState.black,
          // gameState.turn,
          gameState.turn.not(),
          gameState.enpassant,
          gameState.kingCastled,
          gameState.column,
          gameState.halfmove,
          //gameState.canDraw,
          Bool(false),
          // gameState.result
          Provable.if(
            gameState.turn,
            //the reporting player simply wins the game
            Field(GameResult.WHITE_WINS),
            Field(GameResult.BLACK_WINS)
          )
        );
      },
    },

    //TODO: IMPLEMENT STALEMATE
    //PROVING STALEMATE AS CURRENTLY A 3 STEP PROCESS
    //1. CLAIM STALEMATE + ACKNOWLEDGE STALEMATE
    //2. OPPONENT REPORTS FALSE STALEMATE CLAIM
    //3. DEFEND STALEMATE 
    
    resign:{
      privateInputs: [SelfProof,PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        state.black.assertEquals(earlierProof.publicInput.black);
        state.white.assertEquals(earlierProof.publicInput.white);
        const initialGameStateFields = state.initialGameState.toFields();
        const earlierProofFields =
          earlierProof.publicInput.initialGameState.toFields();
        for (let i = 0; i < 2; i++) {
          initialGameStateFields[i].assertEquals(earlierProofFields[i]);
        }

        const gameState = earlierProof.publicOutput;
        // assert correct player
        Provable.if(gameState.turn, state.white, state.black).assertEquals(
          playerPrivateKey.toPublicKey()
        );
        return GameState.from(
          gameState.white,
          gameState.black,
          // gameState.turn,
          gameState.turn.not(),
          gameState.enpassant,
          gameState.kingCastled,
          gameState.column,
          gameState.halfmove,
          //gameState.canDraw,
          Bool(false),
          // gameState.result
          Provable.if(
            gameState.turn,
            //the resigning player simply loses the game
            Field(GameResult.BLACK_WINS),
            Field(GameResult.WHITE_WINS)
          )
        );
      },
    }
  },
});
let Proof_ = ZkProgram.Proof(PvPChessProgram);
export class PvPChessProgramProof extends Proof_ {}
