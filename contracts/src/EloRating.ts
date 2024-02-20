import { Field, Provable } from 'o1js';

const taylorCoeffs = [
  [1n, 2n],
  [-1n, 4n],
  0,
  [1n, 48n],
  0,
  [-1n, 480n],
  0,
  [17n, 80640n],
  0,
  [-31n, 1451520n],
  // add more terms if needed, https://www.wolframalpha.com/input?i=taylor+series+of+1%2F%281%2B10%5Ex%29
];
/**
 * calculate 1/(10^x+1) using taylor series.
 * x : (0,1] * 10^precision, only works for x > 0 !, error increases with x
 * returns a field with value 1/(10^x+1) * 10^decimals
 */
export function calcApproxSol(
  x: Field,
  precision = 5,
  assert = false,
  decimals = 10
): Field {
  let xPowI = Field(1);
  let approx = Field(0);
  let zeros = 0;
  for (let i = 0; i < taylorCoeffs.length; i++) {
    if (taylorCoeffs[i] === 0) continue;

    const numerator = (taylorCoeffs[i] as bigint[])[0];
    const denominator = (taylorCoeffs[i] as bigint[])[1];

    approx = approx
      .mul(10 ** precision)
      .add(
        xPowI.mul(
          Field.from(
            BigInt(Math.floor(1e30 * Math.log(10) ** i * Number(numerator))) /
              denominator
          )
        )
      );
      
    xPowI = xPowI.mul(x);
    zeros += precision;
  }
  return fieldFloorOfXByY(approx, Field(10 ** (25 + zeros - decimals)), assert);
}

/**
 * returns floor(x/y),
 */
export function fieldFloorOfXByY(x: Field, y: Field, assert = false): Field {
  const q = Provable.witness(
    Field,
    () => new Field(x.toBigInt() / y.toBigInt())
  );
  const r = x.sub(q.mul(y));
  if (assert) r.assertLessThan(y);
  return q;
}

/**
 * @param diff is the difference between the player elo ratings multiplied by 10^precision
 * @param precision
 */
export function calcEloChange(
  diff: Field,
  assert = false,
  precision = 5,
  decimals = 10
) {
  const K = Field(20);
  const x = fieldFloorOfXByY(diff, Field(400), assert);
  const approx = calcApproxSol(x, precision, assert, decimals);
  return approx.mul(K);
}
