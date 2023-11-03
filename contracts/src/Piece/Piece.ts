import { Field, Bool, Struct } from 'o1js';

import { Position } from '../Position/Position';
import { RANK } from './Rank';
import { pack, unpack } from '../Packer';

export class Piece extends Struct({
  position: Position,
  captured: Bool,
  rank: Field,
}) {
  static from(position: Position, captured: Bool, rank: Field) {
    return new Piece({ position, captured, rank });
  }
  /**
   * 6 bit position + 1bit + 3 bits rank = 10 bits
   * @param bits
   * @returns
   */
  static fromEncoded(fields: Field[]): Piece {
    const [positionBits, capturedBit, rankBits] = unpack(fields, [6, 1, 3]);
    return Piece.from(
      Position.fromEncoded([positionBits]),
      Bool.fromFields([capturedBit]),
      rankBits
    );
  }

  public encode(): Field[] {
    return pack(
      [...this.position.encode(), this.captured.toField(), this.rank],
      [6, 1, 3]
    );
  }

  public toFields(): Field[] {
    return this.encode();
  }

  public toString() {
    return (
      this.position.x.toString() +
      this.position.y.toString() +
      (this.captured.toString() == 'true' ? '-' : '+') +
      RANK.to.name(this.rank.toBigInt())
    );
  }
}
