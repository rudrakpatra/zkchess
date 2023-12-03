import { Piece } from './Piece';
import { Position } from '../Position/Position';
import { Bool, Field } from 'o1js';
import { RANK } from './Rank';

describe('Piece', () => {
  it('should be able to be created', () => {
    expect(
      Piece.from(Position.from(1, 2), Bool(false), Field.from(1))
    ).toBeTruthy();
  });
  it('should be able to be created from encoded', () => {
    expect(
      Piece.fromEncoded([
        Field.fromBits(
          [false, true, true, true, true, false, false, true, false, false].map(
            (x) => Bool(x)
          )
        ),
      ])
    ).toEqual(Piece.from(Position.from(6, 3), Bool(false), Field.from(1)));
  });
  it('should be able to be encoded', () => {
    expect(Piece.from(Position.from(4, 6), Bool(false), Field.from(2))).toEqual(
      Piece.fromEncoded([
        Field.fromBits(
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
          ].map((x) => Bool(x))
        ),
      ])
    );
  });
  it('should be able to be displayed', () => {
    expect(
      Piece.from(
        Position.from(1, 6),
        Bool(false),
        Field(RANK.from.name.PAWN)
      ).toFEN()
    ).toEqual('16+PAWN');
  });
  it('should be able to be displayed', () => {
    expect(
      Piece.from(
        Position.from(7, 7),
        Bool(false),
        Field(RANK.from.name.KING)
      ).toFEN()
    ).toEqual('77+KING');
  });
});
