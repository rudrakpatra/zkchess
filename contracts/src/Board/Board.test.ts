import { Field } from 'o1js';
import { Board, startingPositions } from './Board';
describe('Board', () => {
  it('should be able to be created', () => {
    expect(Board.startBoard()).toBeTruthy();
  });
  it('should be able to display', () => {
    expect(Board.startBoard().display()).toEqual(startingPositions);
  });
  it('should be able to encode', () => {
    const positions = [
      'p.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ];
    expect(Board.startBoard(positions).encode()).toEqual([Field(0), Field(0)]);
  });
  it('should be able to decode', () => {
    const positions = [
      'p.......',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
      '........',
    ];
    expect(
      Board.fromEncoded(Board.startBoard(positions).encode()).display()
    ).toEqual(positions);
  });
});
