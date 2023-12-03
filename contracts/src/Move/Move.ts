import { Bool, Struct } from 'o1js';
import { Position } from '../Position/Position';

//LAN = Long Algebraic Notation
function getXfromLAN(lan: string) {
  return 8 - parseInt(lan[1]);
}
function getYfromLAN(lan: string) {
  return lan.charCodeAt(0) - 97;
}

function getLANfromX(x: bigint) {
  return (8n - x).toString();
}
function getLANfromY(y: bigint) {
  return String.fromCharCode(Number(97n + y));
}

export class Move extends Struct({
  from: Position,
  to: Position,
  valid: Bool,
}) {
  static from(from: Position, to: Position, valid = Bool(true)) {
    return new Move({ from, to, valid });
  }
  static fromLAN(from: string, to: string) {
    return new Move({
      from: Position.from(getXfromLAN(from), getYfromLAN(from)),
      to: Position.from(getXfromLAN(to), getYfromLAN(to)),
      valid: Bool(true),
    });
  }
  static addCondition(move: Move, condition: Bool) {
    return Move.from(move.from, move.to, move.valid.and(condition));
  }
  public equals(move: Move) {
    return this.from.equals(move.from) && this.to.equals(move.to);
  }
  public toLAN() {
    return (
      getLANfromY(this.from.col.toBigInt()) +
      getLANfromX(this.from.row.toBigInt()) +
      getLANfromY(this.to.col.toBigInt()) +
      getLANfromX(this.to.row.toBigInt())
    );
  }
}
