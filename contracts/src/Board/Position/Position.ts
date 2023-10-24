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
  x: UInt32,
  y: UInt32,
}) {
  static from(x: number | Field, y: number | Field) {
    return new Position({ x: UInt32.from(x), y: UInt32.from(y) });
  }
  static fromEncoded(bits: boolean[]): Position {
    const x = Field.fromBits(bits.slice(0, 3).reverse());
    const y = Field.fromBits(bits.slice(3, 6).reverse());
    return Position.from(x, y);
  }
  public encode(): boolean[] {
    return this.x.value
      .toBits(3)
      .reverse()
      .concat(this.y.value.toBits(3).reverse())
      .map((x) => x.toString() === 'true');
  }
  public equals(position: Position): Bool {
    return this.x.equals(position.x).and(this.y.equals(position.y));
  }
  public set(position: Position) {
    this.x = position.x;
    this.y = position.y;
  }
}
