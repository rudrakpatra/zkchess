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
  Int64,
} from 'o1js';

import { Position } from '../Position/Position';

export const RANKS = {
  PAWN: 1n,
  ROOK: 2n,
  KNIGHT: 4n,
  BISHOP: 8n,
  QUEEN: 16n,
  KING: 32n,
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
    const dx = this.position.x.sub(newPosition.x);
    const dy = this.position.y.sub(newPosition.y);

    const movedDiagonally = dx.equals(dy).or(dx.add(dy).equals(Field(0)));
    const movedStraight = this.position.x
      .equals(newPosition.x)
      .or(this.position.y.equals(newPosition.y));

    //knights move in L shape
    //dx^2+dy^2=5

    const Pawn = Bool(true);
    const Rook = movedStraight;
    const Knight = dx.mul(dx).add(dy.mul(dy)).equals(Field(5));
    const Bishop = movedDiagonally;
    const Queen = movedDiagonally.or(movedStraight);
    const King = dx.mul(dx).add(dy.mul(dy)).lessThanOrEqual(Field(2));

    return this.position
      .equals(newPosition)
      .not()
      .and(
        Provable.switch(this.rank.toBits(6), Bool, [
          Pawn,
          Rook,
          Knight,
          Bishop,
          Queen,
          King,
        ])
      );
  }
  public encode(): Bool[] {
    //(6 bit position +1bit + 6 bits rank) = 13 bits
    return this.position.x
      .toBits(3)
      .concat(this.position.y.toBits(3))
      .concat(this.captured)
      .concat(this.rank.toBits(6));
  }

  public toFields(): Field[] {
    return [Field.fromBits(this.encode())];
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
      this.position.x.toString() +
      this.position.y.toString() +
      (this.captured.toString() == 'true' ? '-' : '+') +
      NameFromRank(this.rank.toBigInt())
    );
  }
}
