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
import { GameResult, GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';
import { GameObject } from '../GameLogic/GameLogic.js';

export class RollupState extends Struct({
  initialGameState: GameState,
  white: PublicKey,
  black: PublicKey,
}) {
  static from(initialGameState: GameState, white: PublicKey, black: PublicKey) {
    return new RollupState({ initialGameState, white, black });
  }
}

const PvPChessProgramRoutines = {
  matchGameState: (
    state: RollupState,
    proof: SelfProof<RollupState, GameState>
  ) => {
    state.black.assertEquals(proof.publicInput.black);
    state.white.assertEquals(proof.publicInput.white);
    const intialGSFields = state.initialGameState.toFields();
    const proofGSFields = proof.publicInput.initialGameState.toFields();
    for (let i = 0; i < 2; i++)
      intialGSFields[i].assertEquals(proofGSFields[i]);
  },
  checkPlayer: (
    state: RollupState,
    earlierProof: SelfProof<RollupState, GameState>,
    playerPrivateKey: PrivateKey
  ) => {
    Provable.if(
      earlierProof.publicOutput.turn,
      state.white,
      state.black
    ).assertEquals(playerPrivateKey.toPublicKey());
  },
};
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
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
        gameState.result
          .equals(Field(GameResult.ONGOING))
          .assertTrue('game already over');

        const gameObject = new GameObject(gameState, move);
        gameObject.preMoveValidations().assertTrue('invalid move');

        // TODO check why this line causes compile to fail
        const newGameState = gameObject.getNextGameState();

        //UPDATE GAME STATE
        return GameState.from(
          newGameState.white,
          newGameState.black,
          newGameState.turn,
          newGameState.enpassant,
          newGameState.kingCastled,
          newGameState.column,
          newGameState.halfmove,
          //newGameState.canDraw,
          Bool(false),
          // newGameState.result
          Provable.if(
            newGameState.black.getKing().captured,
            //WHITE WINS
            Field(GameResult.WHITE_WINS),
            Provable.if(
              newGameState.white.getKing().captured,
              //BLACK WINS
              Field(GameResult.BLACK_WINS),
              //else
              Field(GameResult.ONGOING)
            )
          )
        );
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
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
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
      privateInputs: [SelfProof, Bool, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        accept: Bool,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;

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
    reportIllegalCastling: {
      privateInputs: [SelfProof, Move, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        move: Move,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
        gameState.result
          .equals(Field(GameResult.ONGOING))
          .assertTrue('game already over');
        const gameObject = new GameObject(gameState, move);
        gameObject
          .illegalCastling()
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

    // //TODO: IMPLEMENT STALEMATE
    // //PROVING STALEMATE AS CURRENTLY A 3 STEP PROCESS
    // //1. CLAIM STALEMATE + ACKNOWLEDGE STALEMATE
    // //2. OPPONENT REPORTS FALSE STALEMATE CLAIM
    // //3. DEFEND STALEMATE

    claimStalemate: {
      privateInputs: [SelfProof, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
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
          Field(GameResult.ONGOING_AND_STALEMATE_CLAIMED)
        );
      },
    },

    acknowledgeStalemateClaim: {
      privateInputs: [SelfProof, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
        gameState.result
          .equals(Field(GameResult.ONGOING_AND_STALEMATE_CLAIMED))
          .assertTrue('stalemate claim not reported');

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
          Field(GameResult.DRAW_BY_STALEMATE)
        );
      },
    },

    overrideStalemateClaimByCapturingKing: {
      privateInputs: [SelfProof, Move, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        move: Move,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
        gameState.result
          .equals(Field(GameResult.ONGOING_AND_STALEMATE_CLAIMED))
          .assertTrue('Stalemate must be claimed first');
        const gameObject = new GameObject(gameState, move);
        gameObject.preMoveValidations().assertTrue('invalid move');
        let newGameState = gameObject.getNextGameState();
        newGameState.self().getKing().captured.assertTrue('invalid move');

        //UPDATE GAME STATE
        return GameState.from(
          newGameState.white,
          newGameState.black,
          gameState.turn.not(),
          newGameState.enpassant,
          newGameState.kingCastled,
          newGameState.column,
          newGameState.halfmove,
          //gameState.canDraw,
          Bool(false),
          // gameState.result
          Provable.if(
            gameState.turn,
            Field(GameResult.WHITE_WINS),
            Field(GameResult.BLACK_WINS)
          )
        );
      },
    },

    reportStalemateClaimByValidOpponentMove: {
      privateInputs: [SelfProof, Move, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        move: Move,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
        //currently the prover is the other player,
        //he wants to play as the player who claimed stalemate
        //so skip a turn
        const skipATurn = GameState.from(
          gameState.white,
          gameState.black,
          // gameState.turn,
          gameState.turn.not(),
          gameState.enpassant,
          gameState.kingCastled,
          gameState.column,
          gameState.halfmove,
          gameState.canDraw,
          gameState.result
        );

        const gameObject = new GameObject(skipATurn, move);
        gameObject.preMoveValidations().assertTrue('invalid move');
        //the prover shows a move that is valid
        const newGameState = gameObject.getNextGameState();

        //UPDATE GAME STATE
        return GameState.from(
          newGameState.white,
          newGameState.black,
          gameState.turn.not(),
          newGameState.enpassant,
          newGameState.kingCastled,
          newGameState.column,
          newGameState.halfmove,
          //gameState.canDraw,
          Bool(false),
          // gameState.result
          Field(GameResult.STALEMATE_CLAIM_REPORTED)
        );
      },
    },

    defendStalemateClaim: {
      privateInputs: [SelfProof, Move, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        move: Move,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;
        gameState.result
          .equals(Field(GameResult.STALEMATE_CLAIM_REPORTED))
          .assertTrue('stalemate claim not reported');

        //so skip a turn
        const skipATurn = GameState.from(
          gameState.white,
          gameState.black,
          // gameState.turn,
          gameState.turn.not(),
          gameState.enpassant,
          gameState.kingCastled,
          gameState.column,
          gameState.halfmove,
          gameState.canDraw,
          gameState.result
        );

        const gameObject = new GameObject(skipATurn, move);
        gameObject.preMoveValidations().assertTrue('invalid move');
        const newGameState = gameObject.getNextGameState();
        //check if you have proved that the opponent can capture your king
        newGameState
          .self()
          .getKing()
          .captured.assertTrue('incorrect defence of claim');

        //UPDATE GAME STATE
        return GameState.from(
          newGameState.white,
          newGameState.black,
          gameState.turn.not(),
          newGameState.enpassant,
          newGameState.kingCastled,
          newGameState.column,
          newGameState.halfmove,
          //gameState.canDraw,
          Bool(false),
          // newGameState.result
          Field(GameResult.DRAW_BY_STALEMATE)
        );
      },
    },
    resign: {
      privateInputs: [SelfProof, PrivateKey],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        playerPrivateKey: PrivateKey
      ) {
        earlierProof.verify();
        PvPChessProgramRoutines.matchGameState(state, earlierProof);
        PvPChessProgramRoutines.checkPlayer(
          state,
          earlierProof,
          playerPrivateKey
        );

        const gameState = earlierProof.publicOutput;

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
          Provable.if(
            gameState.turn,
            //the resigning player simply loses the game
            Field(GameResult.BLACK_WINS),
            Field(GameResult.WHITE_WINS)
          )
        );
      },
    },
  },
});

export class PvPChessProgramProof extends ZkProgram.Proof(PvPChessProgram) {}
