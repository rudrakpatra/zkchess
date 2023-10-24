import { Position } from './Position';

describe('Position', () => {
  it('should be able to be created', () => {
    expect(Position.from(1, 2)).toBeTruthy();
  });
  it('should be able to be created from encoded', () => {
    expect(
      Position.fromEncoded([false, true, true, false, true, false])
    ).toEqual(Position.from(3, 2));
  });
  it('should be able to be encoded', () => {
    expect(Position.from(1, 6).encode()).toEqual([
      false,
      false,
      true,
      true,
      true,
      false,
    ]);
  });
});
