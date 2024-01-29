import { Field, Struct, Provable, Bool } from 'o1js';

import { Position } from '../Position/Position.js';
import { Board } from '../Board/Board.js';
import { GameState } from '../GameState/GameState.js';

export class Path extends Struct({
  positions: Provable.Array(Position, 8),
}) {
  static INVALID = new Path({
    positions: Array(8).fill(Board.INVALID_POSITION),
  });
  static from(path: Position[]) {
    return new Path({ positions: path });
  }
  public start() {
    return this.positions[0];
  }
  public end() {
    return this.positions[7];
  }
  private isBounded() {
    return this.positions.map((p) => Board.bounds(p)).reduce(Bool.and);
  }
  private isIntermediatePosition(pos: Position) {
    return pos.equals(this.start()).or(pos.equals(this.end())).not();
  }
  private isContinous() {
    const rightShifted = [this.start(), ...this.positions];
    return this.positions
      .map((p, i) => {
        const q = rightShifted[i];
        return p.distanceSquared(q).lessThanOrEqual(Field(2));
      })
      .reduce(Bool.and);
  }
  private isEmpty(gameState: GameState) {
    return this.positions
      .map((p) =>
        this.isIntermediatePosition(p).and(gameState.isUncapturedPieceAt(p))
      )
      .concat(gameState.self().isUncapturedPieceAt(this.end()))
      .reduce(Bool.or)
      .not();
  }
  public isValid(gameState: GameState) {
    return this.isBounded()
      .and(this.isContinous())
      .and(this.isEmpty(gameState));
  }
  public isSameX() {
    return this.positions
      .map((p) => this.start().row.equals(p.row))
      .reduce(Bool.and);
  }
  public isSameY() {
    return this.positions
      .map((p) => this.start().column.equals(p.column))
      .reduce(Bool.and);
  }
  public isSameXaddY() {
    return this.positions
      .map((p) =>
        this.start().row.add(this.start().column).equals(p.row.add(p.column))
      )
      .reduce(Bool.and);
  }
  public isSameXsubY() {
    return this.positions
      .map((p) =>
        this.start().row.sub(this.start().column).equals(p.row.sub(p.column))
      )
      .reduce(Bool.and);
  }
}
