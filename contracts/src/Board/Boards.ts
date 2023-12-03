import { Field } from 'o1js';
import { Position } from '../Position/Position';

export class Board {
  static size = 8;
  static bounds(position: Position) {
    return position.row
      .greaterThanOrEqual(Field.from(0))
      .and(position.row.lessThan(Field.from(Board.size)))
      .and(position.col.greaterThanOrEqual(Field.from(0)))
      .and(position.col.lessThan(Field.from(Board.size)));
  }
}
