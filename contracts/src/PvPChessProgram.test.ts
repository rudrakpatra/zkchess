import { PrivateKey, Signature } from 'o1js';
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
    expect(proof0.publicOutput.encode()[0]).toEqual(
      initialGameState.encode()[0]
    );

    // whites move
    const proof1 = await PvPChessProgram.move(
      RollupState.from(
        initialGameState,
        whiteKey.toPublicKey(),
        blackKey.toPublicKey()
      ),
      proof0,
      Move.fromLAN('e2', 'e3'),
      whiteKey
    );

    // blacks move
    // const proof2 = await PvPChessProgram.move(
    //   RollupState.from(
    //     initialGameState,
    //     whiteKey.toPublicKey(),
    //     blackKey.toPublicKey()
    //   ),
    //   proof1,
    //   Move.fromLAN('d7', 'd5'),
    //   blackKey
    // );
  });
});
