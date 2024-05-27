import {
  ZkProgram,
  PublicKey,
  Struct,
  Signature,
  PrivateKey,
  Provable,
  SelfProof,
  Field,
  Bool,
} from 'o1js';
import { GameResult, GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';
import { GameObject } from '../GameLogic/GameLogic.js';

class RollupState extends Struct({
  initialGameState: GameState,
  whiteProxy: PublicKey,
  whiteUser: PublicKey,
  blackProxy: PublicKey,
  blackUser: PublicKey,
}) {
  static from(
    initialGameState: GameState,
    whiteUser: PublicKey,
    whiteProxy: PublicKey,
    blackUser: PublicKey,
    blackProxy: PublicKey
  ) {
    return new RollupState({
      initialGameState,
      whiteUser,
      blackUser,
      whiteProxy,
      blackProxy,
    });
  }
}

const PvPChessProgramRoutines = {
  matchGameState: (
    state: RollupState,
    proof: SelfProof<RollupState, GameState>
  ) => {
    state.blackProxy.assertEquals(proof.publicInput.blackProxy);
    state.whiteProxy.assertEquals(proof.publicInput.whiteProxy);
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
      state.whiteProxy,
      state.blackProxy
    ).assertEquals(playerPrivateKey.toPublicKey());
  },
};

/**
 * shows the current `board state` is achieved from a series of valid chess move
 * & the moves performed by the correct player
 */
const MyZkProgram = ZkProgram({
  name: 'pvp-chess-zk-program',
  publicInput: RollupState,
  publicOutput: GameState,

  methods: {
    // verify both players aggreed to start the game by verifying
    // their signatures
    start: {
      privateInputs: [Signature, Signature],
      async method(
        state: RollupState,
        whitePlayerSignature: Signature,
        blackPlayerSignature: Signature
      ) {
        // TODO include time/block number, game information in signature
        whitePlayerSignature.verify(state.whiteUser, [
          ...state.whiteProxy.toFields(),
          ...state.initialGameState.toFields(),
        ]);
        blackPlayerSignature.verify(
          state.blackProxy,
          state.initialGameState.toFields()
        );
        return state.initialGameState;
      },
    },
    // players need to use their privateKey to prove move is from them
    move: {
      privateInputs: [SelfProof, Move, PrivateKey],
      async method(
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
        // gameObject.preMoveValidations().assertTrue('invalid move');

        // TODO check why this line causes compile to fail
        // const newGameState = gameObject.getNextGameState();

        //UPDATE GAME STATE
        return gameState;
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
  },
});

class MyProof extends ZkProgram.Proof(MyZkProgram) {}

describe('Error', () => {
  it('should be able to play a game', async () => {
    const { verificationKey } = await MyZkProgram.compile();
    console.log('compiled!', verificationKey);
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN();

    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );
    console.log('starting..');
    console.time('start');
    await MyZkProgram.start(
      rollupstate,
      Signature.create(whiteKey, [
        ...whiteProxy.toFields(),
        ...initialGameState.toFields(),
      ]),
      Signature.create(blackKey, [
        ...blackProxy.toFields(),
        ...initialGameState.toFields(),
      ])
    );
    console.timeEnd('start');
  });
});
