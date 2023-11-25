<script lang="ts">
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { PromotionRankAsChar } from 'zkchess-contracts';
	import { onMount } from 'svelte';

	let disableMove = true;
	let msg = 'Open the console for msgs. Press init';
	let handleInit = () => {},
		handleStart = () => {},
		handleMove = (e: CustomEvent<ChessMoveUI>) => console.log('unhandled event', e),
		handleDraw = () => {},
		handleResign = () => {},
		handleGetState = () => {};

	let timer = 0;
	let timerIsRunning = false;
	let interval = 0;
	const startTimer = (startTime = 0) => {
		stopTimer();
		timer = startTime;
		timerIsRunning = true;
		interval = setInterval(() => {
			timer++;
		}, 1000);
	};
	const stopTimer = () => {
		timerIsRunning = false;
		clearInterval(interval);
	};

	onMount(async () => {
		const { ZkappWorkerClient } = await import('$lib/zkapp/ZkappWorkerClient');
		const client = new ZkappWorkerClient();
		handleInit = async () => {
			startTimer();
			msg = `Initializing...`;
			await client.init();
			msg = `Initialized in ${timer}s. Press start.`;
			stopTimer();
		};
		handleStart = async () => {
			startTimer();
			msg = `Starting...`;
			await client.start();
			msg = `Started in ${timer}s. Move a piece, draw or resign.`;
			disableMove = false;
			stopTimer();
		};
		handleMove = async (e: CustomEvent<ChessMoveUI>) => {
			startTimer();
			msg = `Moving...`;
			disableMove = true;
			await client.move(e.detail.from, e.detail.to, e.detail.promotion as PromotionRankAsChar);
			msg = `Moved in ${timer}s. Move a piece, draw or resign or start again.`;
			disableMove = false;
			stopTimer();
		};
		handleDraw = async () => {
			startTimer();
			msg = `Drawing...`;
			await client.draw();
			msg = `Drawn in ${timer}s. Press start again.`;
			stopTimer();
		};
		handleResign = async () => {
			startTimer();
			msg = `Resign...`;
			await client.resign();
			msg = `Resigned in ${timer}s. Press start again.`;
			stopTimer();
		};
		handleGetState = async () => {
			startTimer();
			msg = `Getting state...`;
			disableMove = true;
			const state = await client.getState();
			console.log(`received state:${state}`);
			disableMove = false;
			stopTimer();
		};
	});
</script>

<div id="chess-container">
	{#if disableMove}
		<div class="overlay">
			<div class="msg">{msg} {timerIsRunning ? timer + 's' : ''}</div>
		</div>
	{/if}
	<ChessUI on:move={handleMove} />
</div>
<div class="list">
	<p>zkChess 0.0.1</p>
	<hr />
	<button on:click={handleInit}>init</button>
	<button on:click={handleStart}>start</button>
	<button on:click={handleDraw}>draw</button>
	<button on:click={handleResign}>resign</button>
	<button on:click={handleGetState}>get gamestate</button>
</div>

<style>
	#chess-container {
		position: relative;
		width: 100vw;
		max-width: min(600px, calc(100vh - 1rem));

		background: #eee;
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
	}

	.list {
		flex-grow: 1;
		max-width: 200px;
		display: flex;
		flex-wrap: wrap;
		justify-content: start;
		flex-direction: column;
		gap: 0.25rem;
		background-color: #eee;
		padding: 0.5rem 0.5rem;
		border-radius: 0.2rem;
	}
	.msg {
		font-size: 1.2rem;
		padding: 0.5rem;
		margin: 0.5rem;
		background-color: #eee;
		border-radius: 0.2rem;
	}

	@media screen and (max-width: 800px) {
		.list {
			max-width: min(600px, calc(100vh - 1rem));
			width: 100%;
			flex-direction: row;
		}
		.msg {
			font-size: 1.1rem;
		}
	}
	@media screen and (max-width: 450px) {
		.list {
			flex-direction: column;
		}
		.msg {
			font-size: 1rem;
		}
	}
</style>
