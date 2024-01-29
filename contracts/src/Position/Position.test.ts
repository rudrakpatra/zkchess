import { Bool, Field } from 'o1js';
import { Position } from './Position.js';

describe('Position', () => {
  it('should be able to be created', () => {
    expect(Position.from(1, 2)).toBeTruthy();
  });
  it('should be able to be created from encoded', () => {
    expect(
      Position.fromEncoded([
        Field.fromBits(
          [true, true, false, false, true, false].map((x) => Bool(x))
        ),
      ])
    ).toEqual(Position.from(3, 2));
  });
  it('should be able to be encoded', () => {
    expect(Position.from(1, 3).encode()).toEqual([
      Field.fromBits(
        [true, false, false, true, true, false].map((x) => Bool(x))
      ),
    ]);
  });

  it('equals', () => {
    expect(Position.from(1, 3).equals(Position.from(1, 3))).toEqual(Bool(true));
  });
});
