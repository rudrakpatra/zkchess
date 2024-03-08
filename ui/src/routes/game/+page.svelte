<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	import toast from 'svelte-french-toast';

	import DashboardLayout from './DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Player from './Player.svelte';
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { ripple } from 'svelte-ripple-action';
	import type { Move } from 'chess.js';
	import type { PromotionRankAsChar } from 'zkchess-interactive';
	import Loader from '$lib/components/general/Loader.svelte';
	import type { workerClientAPI } from '$lib/zkapp/ZkappWorkerClient';
	import type { PlayerSignature } from '$lib/zkapp/ZkappWorker';

	export let data: PageData;
	$: playerA = $publicKey;
	let playerARating: number;
	$: playerB = data.challenger;
	let playerBRating: number;
	let client: workerClientAPI;

	let clientLoaded = false;
	let gameStarted = false;
	let transactionPending = false;

	let timeLog: TimeLog;
	let fen: string;
	onMount(async () => {
		console.log('onmount');
		timeLog.start('compiling zkapp');
		const { workerClient: client, awaitWorker } = await import('$lib/zkapp/ZkappWorkerClient');
		await awaitWorker();
		// if (playerA) playerARating = await client.getPlayerRating(playerA);
		// if (playerB) playerBRating = await client.getPlayerRating(playerB);
		playerARating = 1200;
		playerBRating = 1100;
		console.log('playerARating', playerARating);
		console.log('playerBRating', playerBRating);
		timeLog.stop('compiling zkapp');
		toast.success('Connected to zkapp worker!');
		clientLoaded = true;
	});
	const start = async () => {
		timeLog.start('starting game');

		if (playerA && playerB) {
			const playerSignatureA: PlayerSignature = {
				publicKey: playerA,
				jsonSignature: jsonSignatureA
			};
			const playerSignatureB: PlayerSignature = {
				publicKey: playerB,
				jsonSignature: jsonSignatureB
			};
		}
		if (playerB) await client.start(playerB, fen);
		timeLog.stop('starting game');
		toast.success('Game started!');
		gameStarted = true;
	};
	const move = async (move: Move) => {
		timeLog.start('moving piece');
		await client.move(move.from, move.to, move.promotion as PromotionRankAsChar);
		timeLog.stop('moving piece');
		toast.success('moved piece!');
	};
	// const offerDraw = async () => {
	// 	transactionPending = true;
	// 	timeLog.start('offering draw');
	// 	await client.offerDraw();
	// 	timeLog.stop('offering draw');
	// 	toast.success('offered draw!');
	// };
	// const acceptDraw = async () => {
	// 	transactionPending = true;
	// 	timeLog.start('accepting draw');
	// 	await client.acceptDraw();
	// 	timeLog.stop('accepting draw');
	// 	toast.success('accepted draw!');
	// };
	// const rejectDraw = async () => {
	// 	transactionPending = true;
	// 	timeLog.start('declining draw');
	// 	await client.rejectDraw();
	// 	timeLog.stop('declining draw');
	// 	toast.success('declined draw!');
	// };
	// const resign = async () => {
	// 	transactionPending = true;
	// 	timeLog.start('resigning');
	// 	await client.resign();
	// 	timeLog.stop('resigning');
	// 	toast.success('resigned!');
	// 	transactionPending = false;
	// };
	const getFEN = async () => {
		timeLog.start('getting state');
		const fen = await client.getFEN();
		timeLog.stop('getting state');
		toast.success('got state!');
		loadFEN(fen);
	};

	const copyInviteLink = () => {
		let link = window.location.href;
		//add params to link
		link += '?challenger=' + $publicKey;
		//copy link to clipboard
		navigator.clipboard.writeText(link);
		toast.success('Copied invite link to clipboard!');
	};
	let loadFEN: (fen: string) => void;
</script>

<svelte:head>
	<title>Mina zkChess game</title>
</svelte:head>

<DashboardLayout>
	<div class="slot" slot="logs">
		<Logs bind:timeLog />
	</div>
	<div class="slot" slot="board">
		<Board readonly={transactionPending} />
	</div>
	<div class="slot" slot="playerB">
		<!-- TODO use custom tokens for rating -->
		<Player username={playerB} rating={playerBRating} />
	</div>
	<div class="slot" slot="actions">
		<div class="absolute inset-1 grid place-content-center">
			{#if !playerA}
				<p class="action">Invite someone to play with you</p>
				<AuroConnect let:connect>
					<div class="grid place-content-center">
						<button use:ripple class="button" on:click={connect}> Connect </button>
					</div>
				</AuroConnect>
			{:else if !clientLoaded}
				<p class="action">
					Compiling <b>zkapp</b>
				</p>
				<div class="grid place-content-center">
					<Loader />
				</div>
			{:else if gameStarted == false}
				{#if transactionPending}
					<p class="action">Transaction in Progress</p>
					<div class="grid place-content-center">
						<Loader />
					</div>
				{:else if playerB}
					<p class="action">
						Player <b title={playerB}>{ellipsis(playerB, 12)}</b>
					</p>
					<div class="grid place-content-center">
						<button use:ripple class="button" on:click={start}>Start Game</button>
					</div>
				{:else}
					<p class="action">Invite someone to play with you</p>
					<div class="grid place-content-center">
						<button use:ripple class="button" on:click={copyInviteLink}>Copy Invite Link</button>
					</div>
				{/if}
			{:else}
				<div class="absolute inset-0 flex flex-col overflow-x-hidden overflow-y-scroll gap-1">
					<!-- <button
				use:ripple 
				class="button flex-1"
				
				on:click={() => {
					toast(ToastModal, {
						props: {
							prompt: 'opponent has offered a draw',
							options: [
								{ label: '👍 accept', action: () => toast.success('accepted draw') },
								{ label: '👎 decline', action: () => toast.error('declined draw') }
							]
						},
						duration: Infinity
					});
				}}	
			>
				⭐test draw
			</button>  -->
					<!-- <button use:ripple class="button flex-1 w-full" on:click={offerDraw}>
						🤝 offer draw
					</button>
					<button use:ripple class="button flex-1 w-full" on:click={resign}> 😖 resign </button>
					<button use:ripple class="button flex-1 w-full" on:click={getFEN}> 📜 get state </button> -->
				</div>
			{/if}
		</div>
	</div>
	<div class="slot" slot="playerA">
		<!-- TODO use custom tokens for rating -->
		<Player username={playerA} rating={playerARating} />
	</div>
</DashboardLayout>

<style>
	.action {
		@apply text-balance p-2 text-center text-lg;
	}
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
