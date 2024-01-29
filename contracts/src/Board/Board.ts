import { Field } from 'o1js';
import { Position } from '../Position/Position.js';

export class Board {
  static INVALID_POSITION = Position.from(Field(8), Field(8));
  static bounds(position: Position) {
    return position.row
      .greaterThanOrEqual(Field.from(0))
      .and(position.row.lessThan(Field.from(8)))
      .and(position.column.greaterThanOrEqual(Field.from(0)))
      .and(position.column.lessThan(Field.from(8)));
  }
}
