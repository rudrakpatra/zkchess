<script lang="ts">
	import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';
	import { RANKS } from '../../../contracts/src/Board/Piece/Piece';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { Move } from 'svelte-chess/dist/api';
	import { Position } from '../../../contracts/src/Board/Position/Position';

	import type { Chess } from '../../../contracts/src/Chess';

	import { onMount } from 'svelte';

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

	onMount(async () => {
		const { Chess } = await import('../../../contracts/build/src/Chess.js');

		let deployerAccount: PublicKey,
			deployerKey: PrivateKey,
			whitePlayerAccount: PublicKey,
			whitePlayerKey: PrivateKey,
			blackPlayerAccount: PublicKey,
			blackPlayerKey: PrivateKey,
			zkAppAddress: PublicKey,
			zkAppPrivateKey: PrivateKey,
			zkApp: Chess;

		let proofsEnabled = false;

		const Local = Mina.LocalBlockchain({ proofsEnabled });
		Mina.setActiveInstance(Local);
		({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
		({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } = Local.testAccounts[1]);
		({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } = Local.testAccounts[2]);

		zkAppPrivateKey = PrivateKey.random();
		zkAppAddress = zkAppPrivateKey.toPublicKey();
		zkApp = new Chess(zkAppAddress);

		async function localDeploy() {
			const txn = await Mina.transaction(deployerAccount, () => {
				AccountUpdate.fundNewAccount(deployerAccount);
				zkApp.deploy();
			});
			await txn.prove();
			// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
			await txn.sign([deployerKey, zkAppPrivateKey]).send();
		}

		await localDeploy();

		const txn = await Mina.transaction(whitePlayerAccount, () => {
			console.log('starting game');
			zkApp.start(whitePlayerAccount, blackPlayerAccount);
		});
		await txn.prove();
		await txn.sign([whitePlayerKey]).send();
		console.log(zkApp.getBoard().display());
	});
</script>

<ChessUI on:move={handleOnMove} />
