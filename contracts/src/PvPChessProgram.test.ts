import { Bool, PrivateKey, Signature } from 'o1js';
import {
  PvPChessProgram,
  PvPChessProgramProof,
  RollupState,
} from './PvPChessProgram';
import { GameState } from './GameState/GameState.js';
import { Move } from './Move/Move';

describe('PvPChessProgram', () => {
  beforeAll(async () => {
    await PvPChessProgram.compile();
  });

  it('should be able to play a game', async () => {
    const whiteKey = PrivateKey.random();
    const blackKey = PrivateKey.random();

    const initialGameState = GameState.fromFEN();

    const proof0 = await PvPChessProgram.start(
      RollupState.from(
        initialGameState,
        whiteKey.toPublicKey(),
        blackKey.toPublicKey()
      ),
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );
    expect(proof0.publicInput.white).toEqual(whiteKey.toPublicKey());
    expect(proof0.publicInput.black).toEqual(blackKey.toPublicKey());

    expect(proof0.publicOutput.encode()).toEqual(initialGameState.encode());
  });

  it('move -> move', async () => {
    const whiteKey = PrivateKey.random();
    const blackKey = PrivateKey.random();

    const initialGameState = GameState.fromFEN();
    const rollupstate=RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      blackKey.toPublicKey()
    )
    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );

    // white's move
    const proof1 = await PvPChessProgram.move(
      rollupstate,
      proof0,
      Move.fromLAN('e2', 'e3'),
      whiteKey
    );

    // black's move
    const proof2 = await PvPChessProgram.move(
      rollupstate,
      proof1,
      Move.fromLAN('d7', 'd5'),
      blackKey
    );
  });

  it('offer draw -> accept', async () => {
    const whiteKey = PrivateKey.random();
    const blackKey = PrivateKey.random();

    const initialGameState = GameState.fromFEN();

    const rollupstate=RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      blackKey.toPublicKey()
    );

    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );

    // white's offers a draw
    const proof1 = await PvPChessProgram.offerDraw(
      rollupstate,
      proof0,
      whiteKey
    );
    // black accepts it
    const proof2=await PvPChessProgram.resolveDraw(
      rollupstate,
      proof1,
      Bool(true),
      blackKey
    )
  });
  it('offer draw -> reject -> move', async () => {
    const whiteKey = PrivateKey.random();
    const blackKey = PrivateKey.random();

    const initialGameState = GameState.fromFEN();

    const rollupstate=RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      blackKey.toPublicKey()
    );

    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );

    // white's offers a draw
    const proof1 = await PvPChessProgram.offerDraw(
      rollupstate,
      proof0,
      whiteKey
    );
    // black rejects it
    const proof2=await PvPChessProgram.resolveDraw(
      rollupstate,
      proof1,
      Bool(false),
      blackKey
    )
    // white moves
    const proof3=await PvPChessProgram.move(
      rollupstate,
      proof2,
      Move.fromLAN('e2', 'e3'),
      whiteKey
    );
  });
});
