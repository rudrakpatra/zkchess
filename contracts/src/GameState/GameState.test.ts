import { Field, Provable } from 'o1js';
import { Position } from '../Position/Position';
import { GameState, defaultFEN } from './GameState';
import { Move } from '../Move/Move';
import { RANK } from '../Piece/Rank';

describe('GameState', () => {
  // it('should be able to be created', () => {
  //   expect(GameState.fromFEN()).toBeTruthy();
  // });
  // it('should be able to display', () => {
  //   expect(GameState.fromFEN().toFEN()).toEqual(defaultFEN);
  // });
  // it('should be able to encode and decode', () => {
  //   const fen =
  //     'r1bqkbnr/pp1ppppp/2n5/2p5/8/1P2P3/PBPP1PPP/RN1QKBNR b KQkq - 2 1';
  //   const encoded = GameState.fromFEN(fen).encode();
  //   expect(GameState.fromEncoded(encoded).toFEN()).toEqual(fen);
  // });
  // it('getMovesfromRay', () => {
  //   const gameState = GameState.fromFEN();
  //   const origin = Position.from(0, 5);
  //   const delta = Position.from(0, 1);
  //   Provable.log(process.memoryUsage());
  //   const moves = gameState.getMovesfromRay(origin, delta);
  //   Provable.log(process.memoryUsage());
  //   Provable.log(moves);
  // });
  // it('generateValidMovesWithoutChecks', () => {
  //   const gameState = GameState.fromFEN();
  //   const moves = gameState.generateMovesWithoutChecks();
  //   const validMoves = moves.filter((m) => m.valid.toString() === 'true');
  //   const namedValidMoves = validMoves.map((m) => m.toLAN());
  //   Provable.log(
  //     'valid moves',
  //     validMoves.length,
  //     '/',
  //     moves.length,
  //     '\n',
  //     namedValidMoves
  //   );
  // });
  // it('isKingInCheck', () => {
  //   const gameState = GameState.fromFEN();
  //   const bool = gameState.isKingInCheck();
  //   Provable.log('isKingInCheck', bool);
  // });
  // it('isKingSafe', () => {
  //   const gameState = GameState.fromFEN();
  //   const kingPawntoE4 = Move.fromLAN('e2', 'e4');
  //   const bool = gameState.isKingSafe(kingPawntoE4);
  //   Provable.log('isKingSafe', bool);
  // });
  // it('toUpdated', () => {
  //   const gameState = GameState.fromFEN();
  //   const kingPawntoE4 = Move.fromLAN('e2', 'e4');
  //   const newGameState = gameState.toUpdated(
  //     kingPawntoE4,
  //     Field(RANK.from.name.ROOK)
  //   );
  //   Provable.log(newGameState.toFEN());
  // });
  // it('assertMoveIsValid', () => {
  //   const gameState = GameState.fromFEN();
  //   const kingPawntoE4 = Move.fromLAN('e2', 'e4');
  //   gameState.assertMoveIsValid(kingPawntoE4);
  // });
  it('move', () => {
    const gameState = GameState.fromFEN();
    const kingPawntoE4 = Move.fromLAN('e2', 'e4');
    gameState.assertMoveIsValid(kingPawntoE4);

    const newGameState = gameState.toUpdated(
      kingPawntoE4,
      Field(RANK.from.name.ROOK)
    );
    Provable.log(newGameState.toFEN());
  });
});
