import { Field } from 'o1js';
import { calcEloChange } from './EloRating';

describe('EloRating calculation', () => {
  it('test calculation for a range of values', () => {
    let maxDelta = 0;
    for (let i = 0; i <= 16; i++) {
      const eloDiff = 400 * 10 ** 5 * (i / 10);

      // Calculate the expected elo change empirically
      const expected = 20 * (1 / (10 ** (eloDiff / 400 / 10 ** 5) + 1));
      const approx = calcEloChange(Field(String(eloDiff).split('.')[0]));
      const delta = expected - Number(approx.toBigInt()) / 1e10;
      maxDelta = Math.max(maxDelta, Math.abs(delta));
      console.log(i / 10, ' delta: ', delta);
    }
    console.log('maxDelta: ', maxDelta);
    expect(maxDelta).toBeLessThanOrEqual(1);
    expect(maxDelta).toBeGreaterThanOrEqual(0);
  });
});
