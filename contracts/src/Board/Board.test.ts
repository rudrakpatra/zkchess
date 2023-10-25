import { Bool, Field } from 'o1js';
import { Board, startingPositions } from './Board';
import { Position } from './Position/Position';
describe('Board', () => {
  it('should be able to be created', () => {
    expect(Board.startBoard()).toBeTruthy();
  });
  it('should be able to display', () => {
    expect(Board.startBoard().display()).toEqual(startingPositions);
  });
  it('should be able to encode and decode', () => {
    const positions = [
      'pppppppp',
      'kqbnrppp',
      '........',
      '........',
      '........',
      '........',
      'PPPPPPPP',
      'PPPPPPPP',
    ];
    const encoded = Board.startBoard(positions).encode();
    expect(Board.fromEncoded(encoded).display()).toEqual(positions);
  });
  it('contains', () => {
    expect(Board.startBoard().contains(Position.from(3, 3))).toEqual(
      Bool(true)
    );
    expect(Board.startBoard().contains(Position.from(8, 8))).toEqual(
      Bool(false)
    );
  });
});
