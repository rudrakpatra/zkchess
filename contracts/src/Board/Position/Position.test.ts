import { Bool } from 'o1js';
import { Position } from './Position';

describe('Position', () => {
  it('should be able to be created', () => {
    expect(Position.from(1, 2)).toBeTruthy();
  });
  it('should be able to be created from encoded', () => {
    expect(
      Position.fromEncoded(
        [true, true, false, false, true, false].map((x) => Bool(x))
      )
    ).toEqual(Position.from(3, 2));
  });
  it('should be able to be encoded', () => {
    expect(Position.from(1, 3).encode()).toEqual(
      [true, false, false, true, true, false].map((x) => Bool(x))
    );
  });
});
