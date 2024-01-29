import { Field, Bool, Struct } from 'o1js';

import { Position } from '../Position/Position.js';
import { rankToName } from './Rank.js';
import { pack, unpack } from '../Packer.js';

export class Piece extends Struct({
  position: Position,
  captured: Bool,
  rank: Field,
}) {
  static from(position: Position, captured: Bool, rank: Field) {
    return new Piece({ position, captured, rank });
  }
  static ENCODING_SCHEME = [6, 1, 3];
  /**
   * 6 bit position + 1bit + 3 bits rank = 10 bits
   * @param bits
   * @returns
   */
  static fromEncoded(fields: Field[]): Piece {
    const [positionBits, capturedBit, rankBits] = unpack(
      fields,
      Piece.ENCODING_SCHEME
    );
    return Piece.from(
      Position.fromEncoded([positionBits]),
      Bool.fromFields([capturedBit]),
      rankBits
    );
  }

  public encode(): Field[] {
    return pack(
      [...this.position.encode(), this.captured.toField(), this.rank],
      Piece.ENCODING_SCHEME
    );
  }

  public toFields(): Field[] {
    return this.encode();
  }

  public toFEN() {
    return (
      this.position.row.toString() +
      this.position.column.toString() +
      (this.captured.toString() == 'true' ? '-' : '+') +
      rankToName(this.rank.toBigInt())
    );
  }
}
