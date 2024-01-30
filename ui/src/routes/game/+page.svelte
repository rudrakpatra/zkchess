<script lang="ts">
	import { get } from 'svelte/store';
	import ellipsis from '$lib/ellipsis';
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import type { Chess, PromotionRankAsChar } from 'zkchess-interactive';
	import { onDestroy, onMount } from 'svelte';
	import toast from 'svelte-french-toast';

	import DashboardLayout from './DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Actions from './Actions.svelte';
	import Player from './Player.svelte';
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';

	import { browser, dev, version } from '$app/environment';
	import type { PageData } from './$types';

	export let data: PageData;

	let compiled = false;
	let gameStarted = false;
	let timeLog: TimeLog;
	let fen: string;
	let loadFen: (fen: string) => void | undefined;
	let handleCompile: () => Promise<void> | undefined;
	let handleStartGame: () => Promise<void> | undefined;
	let handleMove: (e: CustomEvent<ChessMoveUI>) => Promise<void> | undefined;
	let handleDraw: () => Promise<void> | undefined;
	let handleResign: () => Promise<void> | undefined;
	let handleGetState: () => Promise<void> | undefined;
	onMount(async () => {
		const { client } = await import('$lib/zkapp/zkAppWorkerClient');
		handleStartGame = async () => {
			if (!data.challenger) return;
			timeLog.start('start');
			await toast.promise(client.start(get(publicKey), data.challenger, fen), {
				loading: 'Starting...',
				success: 'Game Started!',
				error: 'Could not start the game.'
			});
			timeLog.stop('start');
			gameStarted = true;
		};
		handleMove = async (e: CustomEvent<ChessMoveUI>) => {
			const move = `Move ${e.detail.from} -> ${e.detail.to}`;
			timeLog.start(move);
			await toast.promise(
				client.move(e.detail.from, e.detail.to, e.detail.promotion as PromotionRankAsChar),
				{
					loading: 'Moving...',
					success: 'Moved!',
					error: 'Failed to move.'
				}
			);
			timeLog.stop(move);
		};
		// handleDraw = async () => {
		// 	timeLog.start('draw');
		// 	await toast.promise(client.draw(), {
		// 		loading: 'Drawing...',
		// 		success: 'Drawn!',
		// 		error: 'Failed to draw.'
		// 	});
		// 	timeLog.stop('draw');
		// };
		// handleResign = async () => {
		// 	timeLog.start('resign');
		// 	await toast.promise(client.resign(), {
		// 		loading: 'Resigning...',
		// 		success: 'Resigned!',
		// 		error: 'Failed to resign.'
		// 	});
		// 	timeLog.stop('resign');
		// };
		// handleGetState = async () => {
		// 	timeLog.start('getState');
		// 	const state = await toast.promise(client.getState(), {
		// 		loading: 'Getting state...',
		// 		success: 'Got state!',
		// 		error: 'Failed to get state.'
		// 	});
		// 	loadFen(state as string);
		// 	timeLog.stop('getState');
		// };
	});

	let copyInviteLink = () => {
		let link = window.location.href;
		//add params to link
		link += '?challenger=' + $publicKey;
		//copy link to clipboard
		navigator.clipboard.writeText(link);
		toast.success('Copied invite link to clipboard!');
	};
</script>

<svelte:head>
	<title>Mina zkChess game</title>
</svelte:head>

<DashboardLayout>
	<div class="slot" slot="logs">
		<Logs bind:timeLog />
	</div>
	<div class="slot" slot="board">
		{#if gameStarted}
			<Board bind:loadFen />
		{:else}
			<div class="absolute inset-0 grid place-content-center">
				{#if data.challenger}
					<p class="max-w-[16rem] text-center text-lg mb-4">
						Player
						<b title={data.challenger}>
							{ellipsis(data.challenger, 20)}
						</b>
						is willing to play a game.
					</p>
					<button class="button" on:click={handleStartGame}> 🚀Start </button>
				{:else}
					<p class="text-balance max-w-[16rem] text-center text-lg mb-4">
						Welcome to zkchess!<br />
						Copy this link to invite someone to play with you
						<br />
						<button class="button mt-3" on:click={copyInviteLink}> Invite Link</button>
					</p>
				{/if}
			</div>
		{/if}
	</div>
	<div class="slot" slot="playerB">
		<!-- TODO use custom tokens for rating -->
		<Player username={data.challenger} rating={'100'} />
	</div>
	<div class="slot" slot="actions">
		{#if gameStarted}
			<Actions />
		{:else}
			<div class="absolute inset-0 grid place-content-center text-center text-balance">
				Actions will appear here once the game starts.
			</div>
		{/if}
	</div>
	<div class="slot" slot="playerA">
		<!-- TODO use custom tokens for rating -->
		<Player username={$publicKey} rating={'100'} />
	</div>
</DashboardLayout>

<style>
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
