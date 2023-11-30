<script lang="ts">
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { PromotionRankAsChar } from 'zkchess-contracts';
	import { onDestroy, onMount } from 'svelte';
	import { Stopwatch } from '$lib/Stopwatch';
	import toast from 'svelte-french-toast';

	let stopwatch = new Stopwatch();
	let clientIdle = true;
	$: if (clientIdle) {
		const time = stopwatch.reset();
		toast.success(`took ${time}`, { icon: '⏱️' });
	} else {
		stopwatch.start();
	}

	let gameStarted = false;

	let handleCompileAndStartGame = () => {},
		handleMove = (e: CustomEvent<ChessMoveUI>) => console.log('unhandled event', e),
		handleDraw = () => {},
		handleResign = () => {},
		handleGetState = () => {};

	let loadFen: (fen: string) => void;
	onMount(async () => {
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
	});
	onDestroy(() => {
		stopwatch.destroy();
	});
</script>

<ChessUI on:move={handleMove} bind:load={loadFen} />

<style>
</style>
