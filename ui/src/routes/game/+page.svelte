<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	import toast from 'svelte-french-toast';

	import DashboardLayout from './DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Actions from './Actions.svelte';
	import Player from './Player.svelte';
	import { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import type * as Comlink from 'comlink';
	import { get } from 'svelte/store';

	export let data: PageData;

	let compiled = false;
	let gameStarted = false;
	let timeLog: TimeLog;
	let fen: string;

	let startGame = async () => {
		//starts game
	};
	onMount(async () => {
		//import zkAppWorkerClient
		const obj = await import('$lib/zkApp/zkAppWorkerClient');
		// zkAppWorkerClient = obj.default;
	});
	const copyInviteLink = () => {
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
			<Board />
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
					<button class="button" on:click={startGame}> 🚀Start </button>
				{:else}
					<p class="text-balance max-w-[16rem] text-center text-lg mb-4">
						Welcome to zkchess!<br />
						Copy this link to invite someone to play with you
						<br />
						<button class="button mt-3" on:click={copyInviteLink}>Invite Link</button>
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
