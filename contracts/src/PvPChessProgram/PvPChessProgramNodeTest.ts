import { PrivateKey, Signature } from 'o1js';
import { PvPChessProgram, RollupState } from './PvPChessProgram.js';
import { GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';

console.log('PvPChessProgramNodeTest');
console.log(
  Object.entries(await PvPChessProgram.analyzeMethods())
    .map(([k, v]) => k + ' ' + v.rows)
    .join('\n')
);
await PvPChessProgram.compile();
console.log('PvPChessProgramNodeTest: compiled');

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
  Signature.create(whiteKey, initialGameState.toFields()),
  Signature.create(blackKey, initialGameState.toFields())
);

// white's move\
console.log('proof0\n', proof0.publicOutput.toAscii());

const proof1 = await PvPChessProgram.move(
  rollupstate,
  proof0,
  Move.fromLAN('e2', 'e3'),
  whiteKey
);
console.log('proof1\n', proof1.publicOutput.toAscii());

// black's move
const proof2 = await PvPChessProgram.move(
  rollupstate,
  proof1,
  Move.fromLAN('d7', 'd5'),
  blackKey
);

console.log('proof2\n', proof2.publicOutput.toAscii());

/*
node build/src/PvPChessProgram/PvPChessProgramNodeTest.js
*/
