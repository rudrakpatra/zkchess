import { Field, Bool, Struct } from 'o1js';
import { pack, unpack } from '../Packer.js';

export class Position extends Struct({
  row: Field,
  column: Field,
}) {
  static from(row: number | Field, column: number | Field) {
    return new Position({ row: Field.from(row), column: Field.from(column) });
  }
  static ENCODING_SCHEME = [3, 3];
  static fromEncoded(fields: Field[]): Position {
    const [x, y] = unpack(fields, Position.ENCODING_SCHEME);
    return Position.from(x, y);
  }
  public encode(): Field[] {
    return pack([this.row, this.column], Position.ENCODING_SCHEME);
  }
  public toFields(): Field[] {
    return this.encode();
  }
  public set(position: Position) {
    this.row = position.row;
    this.column = position.column;
  }
  public equals(position: Position): Bool {
    return this.row
      .equals(position.row)
      .and(this.column.equals(position.column));
  }
  public distanceSquared(position: Position): Field {
    const dx = this.row.sub(position.row);
    const dy = this.column.sub(position.column);
    return dx.mul(dx).add(dy.mul(dy));
  }
}
