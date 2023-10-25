import {
  Field,
  SmartContract,
  method,
  Bool,
  state,
  State,
  Poseidon,
  Struct,
  Provable,
  PublicKey,
  UInt32,
} from 'o1js';

import { Position } from '../Position/Position';

export const MaskFromName = {
  PAWN: [true, false, false, false, false, false],
  ROOK: [false, true, false, false, false, false],
  KNIGHT: [false, false, true, false, false, false],
  BISHOP: [false, false, false, true, false, false],
  QUEEN: [false, false, false, false, true, false],
  KING: [false, false, false, false, false, true],
};

export const NameFromRank = (rank: bigint) => {
  switch (rank) {
    case 1n:
      return 'PAWN';
    case 2n:
      return 'ROOK';
    case 4n:
      return 'KNIGHT';
    case 8n:
      return 'BISHOP';
    case 16n:
      return 'QUEEN';
    case 32n:
      return 'KING';
    default:
      return 'UNKNOWN';
  }
};

export class Piece extends Struct({
  position: Position,
  captured: Bool,
  rank: Field,
}) {
  static from(position: Position, captured: Bool, rank: Field) {
    return new Piece({ position, captured, rank });
  }
  canMoveTo(newPosition: Position): Bool {
    return Bool(true);
  }
  public encode(): Bool[] {
    //(6 bit position +1bit + 6 bits rank) = 13 bits
    return this.position.x.value
      .toBits(3)
      .concat(this.position.y.value.toBits(3))
      .concat(this.captured)
      .concat(this.rank.toBits(6));
  }
  static fromEncoded(bits: Bool[]): Piece {
    //(6 bit position +1bit + 6 bits rank) = 13 bits
    return Piece.from(
      Position.fromEncoded(bits.slice(0, 6)),
      Bool(bits[6]),
      Field.fromBits(bits.slice(7, 13))
    );
  }
  public toString() {
    return (
      this.position.x.value.toString() +
      this.position.y.value.toString() +
      (this.captured.value.toString() == 'true' ? '-' : '+') +
      NameFromRank(this.rank.toBigInt())
    );
  }
}
