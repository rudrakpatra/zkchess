import { Bool, Field } from 'o1js';
import { Piece } from '../../Piece/Piece';
import { PlayerState } from './PlayerState';
import { Position } from '../../Position/Position';

describe('GameState', () => {
  it('should be able to be created', () => {
    const pieces = Array(16).fill(
      Piece.from(Position.from(1, 2), Bool(false), Field.from(1))
    );
    const castling = {
      kingSide: Bool(false),
      queenSide: Bool(false),
    };
    expect(PlayerState.from(pieces, castling)).toBeTruthy();
  });
  it('should be able to encode and decode', () => {
    const pieces = Array(16).fill(
      Piece.from(Position.from(1, 2), Bool(false), Field.from(1))
    );
    const castling = {
      kingSide: Bool(false),
      queenSide: Bool(false),
    };
    const playerState = PlayerState.from(pieces, castling);
    expect(PlayerState.fromEncoded(playerState.encode())).toEqual(playerState);
  });
});
