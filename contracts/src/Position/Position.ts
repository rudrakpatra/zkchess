import { Field, Bool, Struct } from 'o1js';
import { pack, unpack } from '../Packer';

export class Position extends Struct({
  x: Field,
  y: Field,
}) {
  static from(x: number | Field, y: number | Field) {
    return new Position({ x: Field.from(x), y: Field.from(y) });
  }
  static ENCODING_SCHEME = [3, 3];
  static fromEncoded(fields: Field[]): Position {
    const [x, y] = unpack(fields, Position.ENCODING_SCHEME);
    return Position.from(x, y);
  }
  public encode(): Field[] {
    return pack([this.x, this.y], Position.ENCODING_SCHEME);
  }
  public toFields(): Field[] {
    return this.encode();
  }
  public set(position: Position) {
    this.x = position.x;
    this.y = position.y;
  }
  public equals(position: Position): Bool {
    return this.x.equals(position.x).and(this.y.equals(position.y));
  }
  public distanceSquared(position: Position): Field {
    const dx = this.x.sub(position.x);
    const dy = this.y.sub(position.y);
    return dx.mul(dx).add(dy.mul(dy));
  }
}
