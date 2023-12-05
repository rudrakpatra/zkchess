import { Bool, Field } from 'o1js';
import { Position } from '../Position/Position';

export class Board {
  static bounds(position: Position) {
    return [
      // 0 <= row <= 7
      [0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => Field.from(i).equals(position.row))
        .reduce(Bool.or),
      // 0 <= col <= 7
      [0, 1, 2, 3, 4, 5, 6, 7]
        .map((i) => Field.from(i).equals(position.col))
        .reduce(Bool.or),
    ].reduce(Bool.and);
  }
}
