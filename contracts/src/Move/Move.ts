import { Field, Struct } from 'o1js';

import { Position } from '../Position/Position.js';
import { PromotionRankAsChar, charToRank, rankToChar } from '../Piece/Rank.js';
import { Path } from './Path.js';

//LAN = Long Algebraic Notation
function getRowfromLAN(lan: string) {
  return 8 - parseInt(lan[1]);
}
function getColumnfromLAN(lan: string) {
  return lan.charCodeAt(0) - 97;
}

/**
 * A chess move represented as a path of 8 positions.
 * @param path The path of the move.
 * @param promotion The piece to promote to, if any.
 */
export class Move extends Struct({
  path: Path,
  promotion: Field,
}) {
  static INVALID = new Move({ path: Path.INVALID, promotion: Field(-1) });
  static from(path: Position[], promotion: Field) {
    return new Move({ path: Path.from(path), promotion });
  }
  static fromLAN(from: string, to: string, promotion?: PromotionRankAsChar) {
    const x1 = getRowfromLAN(from);
    const y1 = getColumnfromLAN(from);
    let x2 = getRowfromLAN(to);
    let y2 = getColumnfromLAN(to);
    let count = 0;
    const path = [];
    while ((x2 != x1 && y2 != y1) || count < 8) {
      count++;
      path.push([x2, y2]);
      if (x2 > x1) {
        x2--;
      } else if (x2 < x1) {
        x2++;
      }
      if (y2 > y1) {
        y2--;
      } else if (y2 < y1) {
        y2++;
      }
    }
    const reversed = path.reverse();
    const positions = reversed.map((p) =>
      Position.from(Field(p[0]), Field(p[1]))
    );

    return new Move({
      path: Path.from(positions),
      promotion: Field(charToRank(promotion || 'q')),
    });
  }
  public toString() {
    return (
      this.path.positions[0].toString() +
      this.path.positions[7].toString() +
      (this.promotion.toString() == '5'
        ? ''
        : rankToChar(this.promotion.toBigInt()))
    );
  }
}
