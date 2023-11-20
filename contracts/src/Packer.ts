import { Field } from 'o1js';

/**
 * takes N sized fields F and shape array S
 *
 * concats shape[i] bits from each field of F into a packed array of fields
 *
 * example:
 *
 * `pack([F(a1,a2...),F(b1,b2,b3...)], [2,3]) => [F(a1,a2,b1,b2,b3....)]`
 * @param fields
 * @param shape
 * @returns
 */
export function pack(fields: Field[], shape: number[]): Field[] {
  const flat = fields.flatMap((f, i) => f.toBits(shape[i]));
  let n = flat.length;
  let packed = [];
  while (n > 254) {
    packed.push(Field.fromBits(flat.slice(0, 254)));
    flat.splice(0, 254);
    n -= 254;
  }
  packed.push(Field.fromBits(flat));
  return packed;
}
/**
 * unpacks a packed array of fields based on shape
 *
 * example:
 *
 * `unpack([F(a1,a2,a3,a4,a5...)], [2,3]) => [F(a1,a2,...)],F(a3,a4,a5...)]`
 * @param fields
 * @param shape
 * @returns
 */
export function unpack(fields: Field[], shape: number[]): Field[] {
  const size = shape.reduce((a, b) => a + b, 0);
  let remaining = size;
  const bits = fields.flatMap((f) => {
    const used = Math.min(remaining, 254);
    remaining -= used;
    return used == 0 ? [] : f.toBits(used);
  });
  let start = 0;
  return shape.map((s) => {
    const field = Field.fromBits(bits.slice(start, start + s));
    start += s;
    return field;
  });
}
