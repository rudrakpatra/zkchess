import { Provable } from 'o1js';
import { Move } from './Move.js';

describe('Path', () => {
  it('creates', () => {
    const move = Move.fromLAN('d8', 'h4', 'q');
    Provable.log(move.path.positions);
  });
  it('sameXaddY', () => {
    const move = Move.fromLAN('d8', 'a5', 'q');
    Provable.log(move.path.isSameXaddY());
  });
  it('sameXsubY', () => {
    const move = Move.fromLAN('d8', 'h4', 'q');
    Provable.log(move.path.isSameXsubY());
  });
});
