import { Piece } from './Piece';
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
      Piece.from(Position.from(1, 6), Bool(false), Field(1)).toString()
    ).toEqual('16+PAWN');
  });
  it('should be able to be displayed', () => {
    expect(
      Piece.from(Position.from(7, 7), Bool(false), Field(1 << 5)).toString()
    ).toEqual('77+KING');
  });
});
