<script lang="ts">
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { PromotionRankAsChar } from 'zkchess-contracts';
	import { onDestroy, onMount } from 'svelte';
	import { Stopwatch } from '$lib/Stopwatch';
	import toast from 'svelte-french-toast';

	import DashboardLayout from './DashboardLayout.svelte';
	import Logs from './Logs.svelte';
	import Board from './Board.svelte';
	import Actions from './Actions.svelte';
	import Player from './Player.svelte';

	let stopwatch = new Stopwatch();
	let clientIdle = false;
	$: if (clientIdle) {
		const time = stopwatch.reset();
		toast.success(`zkapp took ${time}`, { icon: '⏱️' });
	}

	let gameStarted = false;

	let handleCompileAndStartGame = () => {},
		handleMove = (e: CustomEvent<ChessMoveUI>) => console.log('unhandled event', e),
		handleDraw = () => {},
		handleResign = () => {},
		handleGetState = () => {};

	let loadFen: (fen: string) => void;
	onMount(async () => {
		stopwatch.start();
		const { ZkappWorkerClient } = await import('$lib/zkapp/ZkappWorkerClient');
		const client = new ZkappWorkerClient();
		handleCompileAndStartGame = async () => {
			clientIdle = false;
			await toast.promise(client.init(), {
				loading: 'Compiling...',
				success: 'Compiled!',
				error: 'Compilation failed.'
			});
			await toast.promise(client.start(), {
				loading: 'Starting...',
				success: 'Game Started!',
				error: 'Could not start the game.'
			});
			gameStarted = true;
			clientIdle = true;
		};
		handleMove = async (e: CustomEvent<ChessMoveUI>) => {
			clientIdle = false;
			await toast.promise(
				client.move(e.detail.from, e.detail.to, e.detail.promotion as PromotionRankAsChar),
				{
					loading: 'Moving...',
					success: 'Moved!',
					error: 'Failed to move.'
				}
			);
			clientIdle = true;
		};
		handleDraw = async () => {
			clientIdle = false;
			await toast.promise(client.draw(), {
				loading: 'Drawing...',
				success: 'Drawn!',
				error: 'Failed to draw.'
			});
			clientIdle = true;
		};
		handleResign = async () => {
			clientIdle = false;
			await toast.promise(client.resign(), {
				loading: 'Resigning...',
				success: 'Resigned!',
				error: 'Failed to resign.'
			});
			clientIdle = true;
		};
		handleGetState = async () => {
			clientIdle = false;
			const state = await toast.promise(client.getState(), {
				loading: 'Getting state...',
				success: 'Got state!',
				error: 'Failed to get state.'
			});
			loadFen(state as string);
			clientIdle = true;
		};
		clientIdle = true;
	});
	onDestroy(() => {
		stopwatch.destroy();
	});
</script>

<svelte:head>
	<title>Mina zkChess game</title>
</svelte:head>

<DashboardLayout>
	<div slot="logs">
		<Logs />
	</div>
	<div slot="board">
		<Board {handleMove} {loadFen} />
	</div>
	<div slot="playerB">
		<Player />
	</div>
	<div slot="actions">
		<Actions />
	</div>
	<div slot="playerA">
		<Player />
	</div>
</DashboardLayout>
