import { Field } from 'o1js';
import { Position } from '../Position/Position';

export class Board {
  static bounds(position: Position) {
    return position.x
      .greaterThanOrEqual(Field.from(0))
      .and(position.x.lessThan(Field.from(8)))
      .and(position.y.greaterThanOrEqual(Field.from(0)))
      .and(position.y.lessThan(Field.from(8)));
  }
}
