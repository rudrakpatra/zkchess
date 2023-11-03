import { Field, Bool, Struct } from 'o1js';
import { pack, unpack } from '../Packer';

const shape = [3, 3];
export class Position extends Struct({
  x: Field,
  y: Field,
}) {
  static from(x: number | Field, y: number | Field) {
    return new Position({ x: Field.from(x), y: Field.from(y) });
  }
  static fromEncoded(fields: Field[]): Position {
    const [x, y] = unpack(fields, shape);
    return Position.from(x, y);
  }
  public encode(): Field[] {
    return pack([this.x, this.y], shape);
  }
  public toFields(): Field[] {
    return this.encode();
  }
  public equals(position: Position): Bool {
    return this.x.equals(position.x).and(this.y.equals(position.y));
  }
  public set(position: Position) {
    this.x = position.x;
    this.y = position.y;
  }
}
