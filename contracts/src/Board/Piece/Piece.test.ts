import { Piece, RANKS } from './Piece';
import { Position } from '../Position/Position';
import { Bool, Field } from 'o1js';

describe('Piece', () => {
  it('should be able to be created', () => {
    expect(
      Piece.from(Position.from(1, 2), Bool(false), Field.from(1))
    ).toBeTruthy();
  });
  it('should be able to be created from encoded', () => {
    expect(
      Piece.fromEncoded(
        [
          false,
          true,
          true,

          true,
          true,
          false,

          false,

          true,
          false,
          false,
          false,
          false,
          false,
        ].map((x) => Bool(x))
      )
    ).toEqual(Piece.from(Position.from(6, 3), Bool(false), Field.from(1)));
  });
  it('should be able to be encoded', () => {
    expect(
      Piece.from(Position.from(4, 6), Bool(false), Field.from(2)).encode()
    ).toEqual(
      [
        false,
        false,
        true,

        false,
        true,
        true,

        false,

        false,
        true,
        false,
        false,
        false,
        false,
      ].map((x) => Bool(x))
    );
  });
  it('should be able to be displayed', () => {
    expect(
      Piece.from(Position.from(1, 6), Bool(false), Field(RANKS.PAWN)).toString()
    ).toEqual('16+PAWN');
  });
  it('should be able to be displayed', () => {
    expect(
      Piece.from(Position.from(7, 7), Bool(false), Field(RANKS.KING)).toString()
    ).toEqual('77+KING');
  });

  it('pawn cannot move to itw own position', () => {
    expect(
      Piece.from(Position.from(1, 1), Bool(false), Field(RANKS.PAWN)).canMoveTo(
        Position.from(1, 1)
      )
    ).toEqual(Bool(false));
  });
  it('rook can move hor.', () => {
    expect(
      Piece.from(Position.from(1, 1), Bool(false), Field(RANKS.ROOK)).canMoveTo(
        Position.from(1, 2)
      )
    ).toEqual(Bool(true));
  });

  it('rook can move vert.', () => {
    expect(
      Piece.from(Position.from(1, 1), Bool(false), Field(RANKS.ROOK)).canMoveTo(
        Position.from(2, 2)
      )
    ).toEqual(Bool(false));
  });

  it('bishop can move diag.', () => {
    expect(
      Piece.from(
        Position.from(1, 1),
        Bool(false),
        Field(RANKS.BISHOP)
      ).canMoveTo(Position.from(2, 2))
    ).toEqual(Bool(true));
  });
  it('bishop can move diag.', () => {
    expect(
      Piece.from(
        Position.from(7, 3),
        Bool(false),
        Field(RANKS.KNIGHT)
      ).canMoveTo(Position.from(4, 1))
    ).toEqual(Bool(false));
  });
  it('bishop can move diag.', () => {
    expect(
      Piece.from(
        Position.from(7, 3),
        Bool(false),
        Field(RANKS.KNIGHT)
      ).canMoveTo(Position.from(5, 2))
    ).toEqual(Bool(true));
  });
  it('king movement', () => {
    expect(
      Piece.from(Position.from(1, 1), Bool(false), Field(RANKS.KING)).canMoveTo(
        Position.from(2, 2)
      )
    ).toEqual(Bool(true));
    expect(
      Piece.from(Position.from(1, 1), Bool(false), Field(RANKS.KING)).canMoveTo(
        Position.from(2, 3)
      )
    ).toEqual(Bool(false));
    expect(
      Piece.from(Position.from(1, 1), Bool(false), Field(RANKS.KING)).canMoveTo(
        Position.from(2, 3)
      )
    ).toEqual(Bool(false));
  });
});
