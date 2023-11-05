<script lang="ts">
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { PromotionRankAsChar } from '../../../contracts/build/src';
	import { onMount } from 'svelte';

	let disableMove = true;
	let msg = 'Open the console for msgs. Press init';
	$: console.log(`msg at %c${Math.round(performance.now() / 1000)}s\n%c${msg}`, 'color: #2f0;', '');
	let handleInit = () => {},
		handleStart = () => {},
		handleMove = (e: CustomEvent<ChessMoveUI>) => {},
		handleDraw = () => {},
		handleResign = () => {},
		handleGetState = () => {};

	onMount(async () => {
		const { ZkAppClient } = await import('$lib/ZkAppClient');
		const client = new ZkAppClient();
		client.onmessage((e) => (msg = e));
		handleInit = async () => {
			await client.init();
		};
		handleStart = async () => {
			await client.start();
			disableMove = false;
		};
		handleMove = async (e: CustomEvent<ChessMoveUI>) => {
			disableMove = true;
			await client.move(e.detail.from, e.detail.to, e.detail.promotion as PromotionRankAsChar);
			disableMove = false;
		};
		handleDraw = async () => {
			await client.draw();
		};
		handleResign = async () => {
			await client.resign();
		};
		handleGetState = async () => {
			await client.getState();
		};
	});
</script>

<div id="chess-container">
	{#if disableMove}
		<div class="overlay">
			<div class="msg">{msg}</div>
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
