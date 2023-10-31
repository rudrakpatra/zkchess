<script lang="ts">
	import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';
	import { RANKS } from '../../../contracts/src/Board/Piece/Piece';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { Move } from 'svelte-chess/dist/api';
	import { Position } from '../../../contracts/src/Board/Position/Position';
	import { onMount } from 'svelte';

	import ZkappWorkerClient from '$lib/zkappWorkerClient';

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
		let path = [];
		let count = 0;
		while ((x2 != x1 && y2 != y1) || count++ < 8) {
			path.push(Position.from(Field(x2), Field(y2)));
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
		return path.reverse();
	};

	const handleOnMove = (e: CustomEvent<Move>) => {
		const move = e.detail;
		const path = pathFrom(move.from, move.to);
		const promotion = move.promotion ? rankFrom(move.promotion) : Field(RANKS.QUEEN);
		console.log(path);
		console.log(promotion);
	};

	let move;
	onMount(async () => {
		const zkappWorkerClient = new ZkappWorkerClient();
	});
</script>

<ChessUI on:move={handleOnMove} />
