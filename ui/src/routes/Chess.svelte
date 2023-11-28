<script lang="ts">
	import Player from './../lib/Player.svelte';
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { PromotionRankAsChar } from 'zkchess-contracts';
	import { onDestroy, onMount } from 'svelte';
	import { Stopwatch } from '$lib/Stopwatch';
	import toast from 'svelte-french-toast';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut, elasticIn } from 'svelte/easing';

	let stopwatch = new Stopwatch();
	let clientIdle = true;
	$: if (clientIdle) {
		const time = stopwatch.reset();
		toast.success(`took ${time}`, { icon: '⏱️' });
	} else {
		stopwatch.start();
	}

	let gameStarted = false;

	let msg = 'click to compile and start the game';
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

<div class="flex-container">
	<Player />
</div>
<div style="cursor:{!clientIdle ? 'wait' : ''};" class="fluid-container shadow">
	<ChessUI on:move={handleMove} bind:load={loadFen} />
	{#if !clientIdle || !gameStarted}
		<div class="overlay" transition:fade>
			{#if clientIdle}
				<button
					class="msg"
					transition:fly={{ y: 20, easing: cubicOut }}
					on:click={handleCompileAndStartGame}
				>
					{msg}
				</button>
			{/if}
		</div>
	{/if}
</div>
<div class="flex-container">
	<Player />
	<button disabled={!clientIdle || !gameStarted} on:click={handleDraw}>draw</button>
	<button disabled={!clientIdle || !gameStarted} on:click={handleResign}>resign</button>
	<button disabled={!clientIdle || !gameStarted} on:click={handleGetState}>get gamestate</button>
</div>

<style>
	.shadow {
		background-color: #0006;
		box-shadow: 0 0 0.5rem #0006;
	}

	.fluid-container {
		position: relative;
		width: 100vw;
		max-width: min(600px, calc(100vh - 1rem));
		aspect-ratio: 1;
	}
	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: grid;
		place-content: center;
		align-items: center;
		z-index: 5;
		background-color: #222a;
		user-select: none;
	}
	.msg {
		font-size: 1.2rem;
		color: black;
		background-color: #eee;
		box-shadow: 0 0 0.5rem #0006;
		margin: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.2rem;
	}
</style>
