import { PrivateKey, Signature } from 'o1js';
import {
  PvPChessProgram,
  RollupState,
} from './PvPChessProgram.js';
import { GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';

await PvPChessProgram.compile();

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