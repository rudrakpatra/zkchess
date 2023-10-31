import { Field } from 'o1js';
import { RANKS } from '../../../contracts/build/src/Board/Piece/Piece';
import { Position } from '../../../contracts/build/src/Board/Position/Position';
import type { Move } from 'svelte-chess/dist/api';
import { Path } from '../../../contracts/build/src';

const rankFrom = (piece: string) => {
	switch (piece) {
		case 'p':
			return Field(RANKS.PAWN);
		case 'n':
			return Field(RANKS.KNIGHT);
		case 'b':
			return Field(RANKS.BISHOP);
		case 'r':
			return Field(RANKS.ROOK);
		case 'q':
			return Field(RANKS.QUEEN);
		case 'k':
			return Field(RANKS.KING);
		default:
			throw new Error('Invalid piece');
	}
};
// create a path of 8 steps from the from position to the to position
// the path is easier to prove that there was no piece in the way
// if the path length is less than 8
// we pad the start position with the same position
const pathFrom = (from: string, to: string) => {
	const x1 = 8 - parseInt(from[1]);
	const y1 = from.charCodeAt(0) - 97;
	let x2 = 8 - parseInt(to[1]);
	let y2 = to.charCodeAt(0) - 97;
	let count = 0;
	const path = [];
	while ((x2 != x1 && y2 != y1) || count < 8) {
		count++;
		path.push([x2, y2]);
		if (x2 > x1) {
			x2--;
		} else if (x2 < x1) {
			x2++;
		}
		if (y2 > y1) {
			y2--;
		} else if (y2 < y1) {
			y2++;
		}
	}
	const reversed = path.reverse();
	console.log(reversed.map((p) => p.join('')).join(' '));
	const positions = reversed.map((p) => Position.from(Field(p[0]), Field(p[1])));
	return Path.from(positions);
};

export const getMoveFromUIEvent = (e: CustomEvent<Move>) => {
	const move = e.detail;
	const path = pathFrom(move.from, move.to);
	const promotion = move.promotion ? rankFrom(move.promotion) : Field(RANKS.QUEEN);
	return { path, promotion };
};
