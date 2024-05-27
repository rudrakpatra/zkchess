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
  it('should be able to play a game', async () => {
    console.log('should be able to play a game');
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
    // console.log(proof0.toJSON());
    expect(proof0.publicInput.whiteUser).toEqual(whiteKey.toPublicKey());
    expect(proof0.publicInput.blackUser).toEqual(blackKey.toPublicKey());

    expect(proof0.publicOutput.encode()).toEqual(initialGameState.encode());
  });

  it('move -> move', async () => {
    console.log('move -> move');
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
      whiteProxy
    );
    console.timeEnd('move1');

    // black's move
    console.time('move2');
    const proof2 = await PvPChessProgram.move(
      rollupstate,
      proof1,
      Move.fromLAN('d7', 'd5'),
      blackProxy
    );
    console.timeEnd('move2');
  });

  it('offer draw -> accept', async () => {
    console.log('offer draw -> accept');
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
    console.time('start');
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
    console.time('white offers a draw');
    // white's offers a draw
    const proof1 = await PvPChessProgram.offerDraw(
      rollupstate,
      proof0,
      whiteProxy
    );
    console.timeEnd('white offers a draw');
    console.time('black accepts it');
    // black accepts it
    const proof2 = await PvPChessProgram.resolveDraw(
      rollupstate,
      proof1,
      Bool(true),
      blackProxy
    );
    console.timeEnd('black accepts it');
  });
  it('offer draw -> reject -> move', async () => {
    console.log('offer draw -> reject -> move');
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
    console.time('start');
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


    console.time('white offers a draw');
    // white's offers a draw
    const proof1 = await PvPChessProgram.offerDraw(
      rollupstate,
      proof0,
      whiteProxy
    );
    console.timeEnd('white offers a draw');
    console.time('black rejects it');
    // black rejects it
    const proof2 = await PvPChessProgram.resolveDraw(
      rollupstate,
      proof1,
      Bool(false),
      blackProxy
    );
    console.timeEnd('black rejects it');
    console.time('white moves');
    // white moves
    const proof3 = await PvPChessProgram.move(
      rollupstate,
      proof2,
      Move.fromLAN('e2', 'e3'),
      whiteProxy
    );
    console.timeEnd('white moves');
  });

  //stalemate
  it('claim stalemate', async () => {
    console.log('claim stalemate');
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
    console.time('start');
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
    console.time('claim stalemate');
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteProxy
    );
    console.timeEnd('claim stalemate');
  });
  it('claim stalemate -> acknowledge', async () => {
    console.log('claim stalemate -> acknowledge');
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
    console.time('start');
    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );
    console.timeEnd('start');

    // white's move
    console.time('white claims stalemate');
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteProxy
    );
    console.timeEnd('white claims stalemate');
    // black accepts
    console.time('black acknowledge stalemate');
    const proof2 = await PvPChessProgram.acknowledgeStalemateClaim(
      rollupstate,
      proof1,
      blackProxy
    );
    console.timeEnd('black acknowledge stalemate');

    expect(
      proof2.publicOutput.result.equals(GameResult.DRAW_BY_STALEMATE)
    ).toStrictEqual(Bool(true));
  });
  it('claim stalemate -> override by checkmate', async () => {
    console.log('claim stalemate -> override by checkmate');
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

    console.time('start');
    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );
    console.timeEnd('start');

    // white's claims a stalemate
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteProxy
    );
    // black overrides it by checkmate
    const proof2 = await PvPChessProgram.overrideStalemateClaimByCapturingKing(
      rollupstate,
      proof1,
      Move.fromLAN('b2', 'a2'),
      blackProxy
    );
    expect(proof2.publicOutput.result.equals(GameResult.BLACK_WINS)).toStrictEqual(
      Bool(true)
    );
  });
  it('claim stalemate -> override by opponent move', async () => {
    console.log('claim stalemate -> override by opponent move');
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

    console.time('start');
    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );
    console.timeEnd('start');

    // white claims a stalemate
    console.time('white claims stalemate');
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteProxy
    );
    console.timeEnd('white claims stalemate');
    // black overrides it by moving
    console.time('black ovverides it by moving');
    const proof2 =
      await PvPChessProgram.reportStalemateClaimByValidOpponentMove(
        rollupstate,
        proof1,
        Move.fromLAN('a2', 'a3'),
        blackProxy
      );
    console.timeEnd('black ovverides it by moving');
    expect(
      proof2.publicOutput.result.equals(GameResult.STALEMATE_CLAIM_REPORTED)
    ).toStrictEqual(Bool(true));
  });

  it('claim stalemate -> false override -> defend claim', async () => {
    console.log('claim stalemate -> false override -> defend claim');
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
    console.time('start');
    const proof0 = await PvPChessProgram.start(
      rollupstate,
      Signature.create(whiteKey, initialGameState.toFields()),
      Signature.create(blackKey, initialGameState.toFields())
    );
    console.timeEnd('start');

    // white's move
    console.time('white claims stalemate');
    const proof1 = await PvPChessProgram.claimStalemate(
      rollupstate,
      proof0,
      whiteProxy
    );
    console.timeEnd('white claims stalemate');
    // black's overrides using false move
    console.time('black reports stalemate')
    const proof2 =
      await PvPChessProgram.reportStalemateClaimByValidOpponentMove(
        rollupstate,
        proof1,
        Move.fromLAN('a1', 'b1'),
        blackProxy
      );
    console.time('black reports stalemate')
    // white defends by showing it's king can now be captured
    console.time('white defends by showing its king can now be captured')
    const proof3 = await PvPChessProgram.defendStalemateClaim(
      rollupstate,
      proof2,
      Move.fromLAN('c2', 'b1'),
      whiteProxy
    );
    console.timeEnd('white defends by showing its king can now be captured')
    expect(
      proof3.publicOutput.result.equals(GameResult.DRAW_BY_STALEMATE)
    ).toStrictEqual(Bool(true));
  });
});

// time logs
/*
$ npm run test -- PvPChessProgram.test.ts

> zkchess-interactive@0.1.3 test
> node --trace-warnings --max-old-space-size=8192 --experimental-vm-modules node_modules/jest/bin/jest.js PvPChessProgram.test.ts

  ...

  console.time
    PvPChessProgram: 1 ms

      at src/PvPChessProgram/PvPChessProgram.test.ts:452:9

  console.log
    analyizing methods

      at src/PvPChessProgram/PvPChessProgram.test.ts:8:13

  console.log
    $ acknowledgeStalemateClaim 204

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ claimStalemate 204

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ defendStalemateClaim 9717

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ move 9185

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ offerDraw 204

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ overrideStalemateClaimByCapturingKing 9190

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ reportIllegalCastling 6272

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ reportStalemateClaimByValidOpponentMove 9490

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ resign 203

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ resolveDraw 205

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.log
    $ start 2472

      at src/PvPChessProgram/PvPChessProgram.test.ts:11:15
          at Array.forEach (<anonymous>)

  console.time
    analyzed: 11963 ms

      at src/PvPChessProgram/PvPChessProgram.test.ts:13:13

  console.log
    compiling...

      at src/PvPChessProgram/PvPChessProgram.test.ts:14:13

  console.time
    compiled: 99448 ms

      at src/PvPChessProgram/PvPChessProgram.test.ts:17:13

  console.log
    should be able to play a game

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:20:13)

  console.time
    start: 32291 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:47:13)

  console.log
    move -> move

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:56:13)

  console.time
    start: 30084 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:84:13)

  console.time
    move1: 53099 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:94:13)

  console.time
    move2: 48880 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:104:13)

  console.log
    offer draw -> accept

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:108:13)

  console.time
    start: 30561 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:135:13)

  console.time
    white offers a draw: 41368 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:143:13)

  console.time
    black accepts it: 40402 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:152:13)

  console.log
    offer draw -> reject -> move

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:155:13)

  console.time
    start: 29286 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:182:13)

  console.time
    white offers a draw: 38469 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:192:13)

  console.time
    black rejects it: 38400 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:201:13)

  console.time
    white moves: 49973 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:210:13)

  console.log
    claim stalemate

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:215:13)

  console.time
    start: 29213 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:244:13)

  console.time
    claim stalemate: 40750 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:253:13)

  console.log
    claim stalemate -> acknowledge

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:256:13)

  console.time
    start: 29266 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:279:13)

  console.time
    white claims stalemate: 38405 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:288:13)

  console.time
    black acknowledge stalemate: 37274 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:296:13)

  console.log
    claim stalemate -> override by checkmate

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:303:13)

  console.time
    start: 25786 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:325:13)

  console.log
    claim stalemate -> override by opponent move

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:345:13)

  console.time
    start: 31062 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:369:13)

  console.time
    white claims stalemate: 38502 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:378:13)

  console.time
    black ovverides it by moving: 49541 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:388:13)

  console.log
    claim stalemate -> false override -> defend claim

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:395:13)

  console.time
    start: 29191 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:418:13)

  console.time
    white claims stalemate: 36367 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:427:13)

  console.time
    white defends by showing its king can now be captured: 49610 ms

      at Object.<anonymous> (src/PvPChessProgram/PvPChessProgram.test.ts:446:13)

 PASS  src/PvPChessProgram/PvPChessProgram.test.ts (1119.194 s)
  PvPChessProgram
    ✓ should be able to play a game (32408 ms)
    ✓ move -> move (132074 ms)
    ✓ offer draw -> accept (112355 ms)
    ✓ offer draw -> reject -> move (156145 ms)
    ✓ claim stalemate (69986 ms)
    ✓ claim stalemate -> acknowledge (104973 ms)
    ✓ claim stalemate -> override by checkmate (117825 ms)
    ✓ claim stalemate -> override by opponent move (119141 ms)
    ✓ claim stalemate -> false override -> defend claim (158744 ms)

Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        1119.3 s
Ran all test suites matching /PvPChessProgram.test.ts/i.
*/
