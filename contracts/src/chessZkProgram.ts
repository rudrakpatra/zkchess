import { Field, Provable, SelfProof, ZkProgram } from 'o1js';
import { GameState } from './GameState/GameState';
import { Move } from './Move/Move';

/**
 * shows the current `board state` is achieved from a series of valid chess move
 */
export const ChessZkProgram = ZkProgram({
  name: 'chess-zk-program',
  publicInput: GameState,
  publicOutput: GameState,

  methods: {
    // inialize the gameState.
    start: {
      privateInputs: [],
      method(gameState: GameState) {
        return gameState;
      },
    },
    // move to
    move: {
      privateInputs: [SelfProof, Move, Field],
      method(
        initialGameState: GameState,
        earlierProof: SelfProof<GameState, GameState>,
        move: Move,
        promotion: Field
      ) {
        earlierProof.verify();
        // TODO check earlierProof.publicInput equals initialGameState
        const gameState = earlierProof.publicOutput;
        gameState.assertMoveIsValid(move);
        gameState.assertPromotionIsValid(promotion);
        // return next game state
        return gameState.toUpdated(move, promotion);
      },
    },

    draw: {
      privateInputs: [SelfProof],
      method(
        initialGameState: GameState,
        earlierProof: SelfProof<GameState, GameState>
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
      privateInputs: [SelfProof],
      method(
        initialGameState: GameState,
        earlierProof: SelfProof<GameState, GameState>
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
