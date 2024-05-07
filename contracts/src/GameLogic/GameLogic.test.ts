import { Provable } from 'o1js';
import { GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';
import { GameEvent, GameObject } from './GameLogic.js';

describe('GameLogic', () => {
  // it('creates', () => {
  //   const gameState = GameState.fromFEN();
  //   const gameEvent = new GameEvent(gameState, Move.fromLAN('e2', 'e4'));
  //   Provable.log({
  //     advances: gameEvent.gameAdvances(),
  //     promotes: gameEvent.movePromotesPawn(),
  //     movesBishop: gameEvent.movesBishop(),
  //     movesKing: gameEvent.movesKing(),
  //     movesKnight: gameEvent.movesKnight(),
  //     movesPawn: gameEvent.movesPawn(),
  //     movesQueen: gameEvent.movesQueen(),
  //     movesRook: gameEvent.movesRook(),
  //     pathIsValid: gameEvent.pathIsValid,
  //   });
  // });
  // it('queen', () => {
  //   const fen = 'rnbqkbnr/pppp1ppp/4p3/8/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 1';
  //   const gameState = GameState.fromFEN(fen);
  //   const gameEvent = new GameEvent(gameState, Move.fromLAN('d8', 'h4'));
  //   Provable.log({
  //     advances: gameEvent.gameAdvances(),
  //     promotes: gameEvent.movePromotesPawn(),
  //     movesBishop: gameEvent.movesBishop(),
  //     movesKing: gameEvent.movesKing(),
  //     movesKnight: gameEvent.movesKnight(),
  //     movesPawn: gameEvent.movesPawn(),
  //     movesQueen: gameEvent.movesQueen(),
  //     movesRook: gameEvent.movesRook(),
  //     pathIsValid: gameEvent.pathIsValid,
  //   });
  // });
  it('move test', () => {
    const fen = 'rn2kbnr/ppp1pppp/4b3/3q4/8/2N5/PPPPQPPP/R1B1KBNR b KQkq - 3 1';
    const gameState = GameState.fromFEN(fen);
    const gameLogic = new GameObject(gameState, Move.fromLAN('d5', 'd8'));
    console.log(gameLogic.preMoveValidations().toString());
  });
});
