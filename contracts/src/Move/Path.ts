import { Field, Struct, Provable, Bool } from 'o1js';

import { Position } from '../Position/Position';
import { Board } from '../Board/Boards';
import { GameState } from '../GameState/GameState';

export class Path extends Struct({
  positions: Provable.Array(Position, 7),
}) {
  static from(from: Position, to: Position) {
    //we multiply row and col by 8 making a 64 x 64 grid to remove floating points
    const fromTimes8 = Position.from(from.row.mul(8), from.col.mul(8));
    const toTimes8 = Position.from(to.row.mul(8), to.col.mul(8));
    const positions = Array(7).map((_, i) => {
      const t = Field(1 + i);
      //x=x1*t + x2*(1-t)
      //x=x2+(x1- x2)*t
      const xTimes8 = fromTimes8.row.add(
        toTimes8.row.sub(fromTimes8.row).mul(t)
      );
      const yTimes8 = fromTimes8.col.add(
        toTimes8.col.sub(fromTimes8.col).mul(t)
      );
      const x = xTimes8.div(8);
      const y = yTimes8.div(8);
      return Position.from(
        from.row.add(to.row.sub(from.row).mul(t)).mul(8),
        from.col.add(to.col.sub(from.col).mul(t)).mul(8)
      );
    });
    return new Path({ positions });
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
      .concat(gameState.self().get.isUncapturedPieceAt(this.end()))
      .reduce(Bool.or)
      .not();
  }
  public isValid(gameState: GameState) {
    return this.isBounded()
      .and(this.isContinous())
      .and(this.isEmpty(gameState));
  }
}
