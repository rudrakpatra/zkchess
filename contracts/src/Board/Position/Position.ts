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

export class Position extends Struct({
  x: Field,
  y: Field,
}) {
  static from(x: number | Field, y: number | Field) {
    return new Position({ x: Field.from(x), y: Field.from(y) });
  }
  static fromEncoded(bits: Bool[]): Position {
    const x = Field.fromBits(bits.slice(0, 3));
    const y = Field.fromBits(bits.slice(3, 6));
    return Position.from(x, y);
  }
  public encode(): Bool[] {
    return this.x.toBits(3).concat(this.y.toBits(3));
  }
  public toFields(): Field[] {
    return [Field.fromBits(this.encode())];
  }
  public equals(position: Position): Bool {
    return this.x.equals(position.x).and(this.y.equals(position.y));
  }
  public set(position: Position) {
    this.x = position.x;
    this.y = position.y;
  }
}
