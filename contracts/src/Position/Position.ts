import { Field, Bool, Struct } from 'o1js';
import { pack, unpack } from '../Packer';

export class Position extends Struct({
  row: Field,
  col: Field,
}) {
  static from(row: number | Field, col: number | Field) {
    return new Position({ row: Field.from(row), col: Field.from(col) });
  }
  static ENCODING_SCHEME = [3, 3];
  static fromEncoded(fields: Field[]): Position {
    const [x, y] = unpack(fields, Position.ENCODING_SCHEME);
    return Position.from(x, y);
  }
  public encode(): Field[] {
    return pack([this.row, this.col], Position.ENCODING_SCHEME);
  }
  public toFields(): Field[] {
    return this.encode();
  }
  public equals(position: Position): Bool {
    return this.row.equals(position.row).and(this.col.equals(position.col));
  }
  public distanceSquared(position: Position): Field {
    const drow = this.row.sub(position.row);
    const dcol = this.col.sub(position.col);
    return drow.mul(drow).add(dcol.mul(dcol));
  }
}
