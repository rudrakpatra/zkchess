import {
  Field,
  Provable,
  SelfProof,
  ZkProgram,
  PublicKey,
  Struct,
  Signature,
} from 'o1js';
import { GameState } from './GameState/GameState';
import { Move } from './Move/Move';

export class RollupState extends Struct({
  initialGameState: GameState,
  white: PublicKey,
  black: PublicKey,
}) {}
/**
 * shows the current `board state` is achieved from a series of valid chess move
 * & the moves are signed by the correct players
 */
export const ChessZkProgram = ZkProgram({
  name: 'chess-zk-program',
  publicInput: RollupState,
  publicOutput: GameState,

  methods: {
    // inialize the gameState.
    start: {
      privateInputs: [Signature, Signature],
      method(
        state: RollupState,
        whitePlayerSignature: Signature,
        blackPlayerSignature: Signature
      ) {
        // verify both players aggreed to start the game by verifying
        // their signatures of the hash of the game state
        whitePlayerSignature.verify(state.white, state.initialGameState.hash());
        blackPlayerSignature.verify(state.black, state.initialGameState.hash());
        return state.initialGameState;
      },
    },
    // move to
    move: {
      privateInputs: [SelfProof, Move, Field, Signature],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        move: Move,
        promotion: Field,
        playerSignature: Signature
      ) {
        earlierProof.verify();
        // TODO verify signature

        // TODO check earlierProof.publicInput equals initialGameState
        const gameState = earlierProof.publicOutput;
        gameState.assertMoveIsValid(move);
        gameState.assertPromotionIsValid(promotion);
        // return next game state
        return gameState.toUpdated(move, promotion);
      },
    },

    draw: {
      privateInputs: [SelfProof, Signature],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        playerSignature: Signature
      ) {
        earlierProof.verify();
        // TODO check earlierProof.publicInput equals initialGameState
        const gameState = earlierProof.publicOutput;

        gameState.canDraw.assertTrue('draw not allowed');
        gameState.finalized = Field(GameState.FINALSTATES.DRAW);
        return gameState;
      },
    },
    resign: {
      privateInputs: [SelfProof, Signature],
      method(
        state: RollupState,
        earlierProof: SelfProof<RollupState, GameState>,
        playerSignature: Signature
      ) {
        earlierProof.verify();
        // TODO check earlierProof.publicInput equals initialGameState
        const gameState = earlierProof.publicOutput;
        gameState.finalized = Provable.if(
          gameState.turn,
          Field(GameState.FINALSTATES.BLACK_WON),
          Field(GameState.FINALSTATES.WHITE_WON)
        );
        return gameState;
      },
    },
  },
});
let Proof_ = ZkProgram.Proof(ChessZkProgram);
export class ChessZkProgramProof extends Proof_ {}
