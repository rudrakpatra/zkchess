<script lang="ts">
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import type { PromotionRankAsChar } from 'zkchess-contracts';
	import { onDestroy, onMount } from 'svelte';
	import { Stopwatch } from '$lib/Stopwatch';
	import toast from 'svelte-french-toast';

	import DashboardLayout from './DashboardLayout.svelte';
	import Logs from './Logs.svelte';
	import Board from './Board.svelte';
	import Actions from './Actions.svelte';
	import Player from './Player.svelte';
	import { animationOnFocus } from '$lib/actions/interaction';
	import { browser, dev, building, version } from '$app/environment';

	let stopwatch = new Stopwatch();
	let clientIdle = false;
	$: if (clientIdle) {
		const time = stopwatch.reset();
		logs.push(`zkapp took ${time}`);
		toast.success(`zkapp took ${time}`, { icon: '⏱️' });
	} else {
		if (browser) stopwatch.start();
	}

	let gameStarted = false;

	let handleCompileAndStartGame = async () => {},
		handleMove = async (e: CustomEvent<ChessMoveUI>) => console.log('unhandled event', e),
		handleDraw = async () => {},
		handleResign = async () => {},
		handleGetState = async () => {};

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
			logs.push('Game Started!');
			logs = logs;
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
			logs.push(`Moved ${e.detail.from} -> ${e.detail.to}`);
			logs = logs;
			clientIdle = true;
		};
		handleDraw = async () => {
			clientIdle = false;
			await toast.promise(client.draw(), {
				loading: 'Drawing...',
				success: 'Drawn!',
				error: 'Failed to draw.'
			});
			logs.push('Drawn!');
			logs = logs;
			clientIdle = true;
		};
		handleResign = async () => {
			clientIdle = false;
			await toast.promise(client.resign(), {
				loading: 'Resigning...',
				success: 'Resigned!',
				error: 'Failed to resign.'
			});
			logs.push('Resigned!');
			logs = logs;
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
			logs.push('Received state!');
			logs = logs;
			clientIdle = true;
		};
		clientIdle = true;
	});
	onDestroy(() => {
		stopwatch.destroy();
	});

	let logs = ['Importing zkChess...'];
</script>

<svelte:head>
	<title>Mina zkChess game</title>
</svelte:head>

{#if gameStarted}
	<DashboardLayout>
		<div class="slot" slot="logs">
			<Logs {logs} />
		</div>
		<div class="slot" slot="board">
			<Board bind:handleMove bind:loadFen />
		</div>
		<div class="slot" slot="playerB">
			<Player />
		</div>
		<div class="slot" slot="actions">
			<Actions bind:handleDraw bind:handleResign bind:handleGetState />
		</div>
		<div class="slot" slot="playerA">
			<Player />
		</div>
	</DashboardLayout>
{:else}
	<div class="fixed inset-0 grid place-content-center">
		<p class="text-balance max-w-[16rem] text-center text-lg mb-4">
			Welcome to zk chess example. <br />
			This example first compiles the contract and then starts a game on a local test chain.<br />
		</p>
		<button class="button" use:animationOnFocus on:click|once={handleCompileAndStartGame}>
			🚀 compile & start game
		</button>
	</div>
{/if}

<style>
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
