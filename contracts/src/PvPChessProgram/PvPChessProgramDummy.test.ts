import { PrivateKey } from 'o1js';
import {
  PvPChessProgramMethods,
  PvPChessProgramProof,
  RollupState,
} from './PvPChessProgram.js';
import { GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';
import { GameObject } from '../GameLogic/GameLogic';

describe('PvPChessProgramDummy', () => {
  it('move_test', async () => {
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
    const fen = 'rnb1kbnr/ppp1pppp/8/3q4/8/8/PPPPQPPP/RNB1KBNR b KQkq - 1 1';
    const gs = GameState.fromFEN(fen);
    const move = Move.fromLAN('d5', 'd8', 'q');
    const lastProof = await PvPChessProgramProof.dummy(rollupstate, gs, 2);
    console.log(
      'pre=',
      new GameObject(lastProof.publicOutput, move)
        .preMoveValidations()
        .toString()
    );
    console.log(
      `%c move:${lastProof.publicOutput.toFEN()}\n`,
      'color:#eeff33;'
    );
    const output = await PvPChessProgramMethods.move.method(
      lastProof.publicInput,
      lastProof,
      move,
      blackProxy
    );
    console.log(output.toFEN());
  });
  it.skip('should be able to play a game', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();
    const initialGameState = GameState.fromFEN();
    const proof0 = await PvPChessProgramProof.dummy(
      RollupState.from(
        initialGameState,
        whiteKey.toPublicKey(),
        whiteProxy.toPublicKey(),
        blackKey.toPublicKey(),
        blackProxy.toPublicKey()
      ),
      initialGameState,
      2
    );
    expect(proof0.publicInput.whiteUser).toEqual(whiteKey.toPublicKey());
    expect(proof0.publicInput.whiteProxy).toEqual(whiteProxy.toPublicKey());
    expect(proof0.publicInput.blackProxy).toEqual(blackProxy.toPublicKey());
    expect(proof0.publicInput.blackUser).toEqual(blackKey.toPublicKey());
    expect(proof0.publicOutput.encode()).toEqual(initialGameState.encode());
  });
  it.skip('move -> move', async () => {
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
    const proof0 = await PvPChessProgramProof.dummy(
      rollupstate,
      initialGameState,
      2
    );
    // white's move
    const gs1 = new GameObject(
      initialGameState,
      Move.fromLAN('e2', 'e3')
    ).getNextGameState();
    const proof1 = await PvPChessProgramProof.dummy(rollupstate, gs1, 2);
    expect(proof1.publicOutput.encode()).toEqual(gs1.encode());
    // black
    const gs2 = new GameObject(
      gs1,
      Move.fromLAN('d7', 'd5')
    ).getNextGameState();
    const proof2 = await PvPChessProgramProof.dummy(rollupstate, gs2, 2);
    expect(proof2.publicOutput.encode()).toEqual(gs2.encode());
  });
});
