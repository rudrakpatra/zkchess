import { Bool, PrivateKey, Signature } from 'o1js';
import { PvPChessProgram, RollupState } from './PvPChessProgram';
import { GameResult, GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';

describe('PvPChessProgram', () => {
  beforeAll(async () => {
    console.log('analyizing methods');
    console.time('analyzed');
    Object.entries(await PvPChessProgram.analyzeMethods()).forEach(([k, v]) => {
      console.log('$', k, v.rows);
    });
    console.timeEnd('analyzed');
    console.log('compiling...');
    console.time('compiled');
    await PvPChessProgram.compile();
    console.timeEnd('compiled');
  });
  it.skip('should be able to play a game', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN();

    console.time('start');
    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );
    const proof0 = await PvPChessProgram.start(
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
    console.log(proof0.toJSON());
    expect(proof0.publicInput.whiteUser).toEqual(whiteKey.toPublicKey());
    expect(proof0.publicInput.blackUser).toEqual(blackKey.toPublicKey());

    expect(proof0.publicOutput.encode()).toEqual(initialGameState.encode());
  });

  it.skip('move -> move', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN();

    console.time('start');
    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );
    const proof0 = await PvPChessProgram.start(
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

    // white's move
    console.time('move1');
    const proof1 = await PvPChessProgram.move(
      rollupstate,
      proof0,
      Move.fromLAN('e2', 'e3'),
      whiteKey
    );
    console.timeEnd('move1');

    // black's move
    console.time('move2');
    const proof2 = await PvPChessProgram.move(
      rollupstate,
      proof1,
      Move.fromLAN('d7', 'd5'),
      blackKey
    );
    console.timeEnd('move2');
  });

  it.skip('offer draw -> accept', async () => {
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
    const proof0 = await PvPChessProgram.start(
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

    // white's offers a draw
    const proof1 = await PvPChessProgram.offerDraw(
      rollupstate,
      proof0,
      whiteKey
    );
    // black accepts it
    const proof2 = await PvPChessProgram.resolveDraw(
      rollupstate,
      proof1,
      Bool(true),
      blackKey
    );
  });
  it.skip('offer draw -> reject -> move', async () => {
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
    const proof0 = await PvPChessProgram.start(
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

    // white's offers a draw
    const proof1 = await PvPChessProgram.offerDraw(
      rollupstate,
      proof0,
      whiteKey
    );
    // black rejects it
    const proof2 = await PvPChessProgram.resolveDraw(
      rollupstate,
      proof1,
      Bool(false),
      blackKey
    );
    // white moves
    const proof3 = await PvPChessProgram.move(
      rollupstate,
      proof2,
      Move.fromLAN('e2', 'e3'),
      whiteKey
    );
  });

  //stalemate
  it.skip('claim stalemate', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN(
      '8/8/8/8/8/1q6/2k5/K7 w - - 0 1'
    );

    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );
    const proof0 = await PvPChessProgram.start(
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
    // white's move
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteKey
    );
  });
  it.skip('claim stalemate -> acknowledge', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN(
      '8/8/8/8/8/1q6/2k5/K7 w - - 0 1'
    );

    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );
    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );

    // white's move
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteKey
    );
    // black's accepts
    const proof2 = await PvPChessProgram.acknowledgeStalemateClaim(
      rollupstate,
      proof1,
      blackKey
    );
    expect(
      proof2.publicOutput.result.equals(GameResult.DRAW_BY_STALEMATE)
    ).toBe(Bool(true));
  });
  it.skip('claim stalemate -> override by checkmate', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN('8/8/8/8/8/8/Kqk5/8 w - - 0 1');

    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );

    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );

    // white's claims a stalemate
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteKey
    );
    // black overrides it by checkmate
    const proof2 = await PvPChessProgram.overrideStalemateClaimByCapturingKing(
      rollupstate,
      proof1,
      Move.fromLAN('b2', 'a2'),
      blackKey
    );
    expect(proof2.publicOutput.result.equals(GameResult.BLACK_WINS)).toBe(
      Bool(true)
    );
  });
  it.skip('claim stalemate -> override by opponent move', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN(
      '8/8/8/8/1q6/8/P1k5/K7 w - - 0 1'
    );

    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );

    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );

    // white's claims a stalemate
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteKey
    );
    // black overrides it by moving
    const proof2 =
      await PvPChessProgram.reportStalemateClaimByValidOpponentMove(
        rollupstate,
        proof1,
        Move.fromLAN('a2', 'a3'),
        blackKey
      );
    expect(
      proof2.publicOutput.result.equals(GameResult.DRAW_BY_STALEMATE)
    ).toBe(Bool(true));
  });

  it.skip('claim stalemate -> false override -> defend claim', async () => {
    const whiteKey = PrivateKey.random();
    const whiteProxy = PrivateKey.random();
    const blackKey = PrivateKey.random();
    const blackProxy = PrivateKey.random();

    const initialGameState = GameState.fromFEN(
      '8/8/8/8/8/q7/P1k5/K7 w - - 0 1'
    );

    const rollupstate = RollupState.from(
      initialGameState,
      whiteKey.toPublicKey(),
      whiteProxy.toPublicKey(),
      blackKey.toPublicKey(),
      blackProxy.toPublicKey()
    );
    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );

    // white's move
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteKey
    );
    // black's overrides using false move
    const proof2 =
      await PvPChessProgram.reportStalemateClaimByValidOpponentMove(
        rollupstate,
        proof1,
        Move.fromLAN('a1', 'b1'),
        blackKey
      );
    // white defends by showing it's king can now be captured
    const proof3 = await PvPChessProgram.defendStalemateClaim(
      rollupstate,
      proof2,
      Move.fromLAN('c2', 'b2'),
      whiteKey
    );
    expect(
      proof3.publicOutput.result.equals(GameResult.DRAW_BY_STALEMATE)
    ).toBe(Bool(true));
  });
});
