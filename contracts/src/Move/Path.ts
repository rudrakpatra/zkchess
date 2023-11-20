import { Field, Struct, Provable, Bool } from 'o1js';

import { Position } from '../Position/Position';
import { Board } from '../Board/Boards';
import { GameState } from '../GameState/GameState';

export class Path extends Struct({
  positions: Provable.Array(Position, 8),
}) {
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
      .concat(gameState.self().playerState.isUncapturedPieceAt(this.end()))
      .reduce(Bool.or)
      .not();
  }
  public isValid(gameState: GameState) {
    return this.isBounded()
      .and(this.isContinous())
      .and(this.isEmpty(gameState));
  }
}
