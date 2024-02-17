<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	import toast, { LoaderIcon } from 'svelte-french-toast';

	import DashboardLayout from './DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Player from './Player.svelte';
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import type { ClientAPI } from '$lib/zkapp/ZkappWorkerClient';
	import { ripple } from 'svelte-ripple-action';
	import type { Move } from 'svelte-chess/dist/api';
	import type { MoveEvent } from 'svelte-chess/dist/Chess.svelte';
	import type { PromotionRankAsChar } from 'zkchess-interactive';

	export let data: PageData;
	$: playerA=$publicKey;
	$: playerB=data.challenger;
	let client: Awaited<ReturnType<ClientAPI>>;

	let clientLoaded = false;
	let gameStarted=false;
	let transactionPending=false;

	let timeLog: TimeLog;
	let fen: string;
	onMount(async () => {
		console.log("onmount");
		timeLog.start("importing zkapp client");
		client=await (await import("$lib/zkapp/ZkappWorkerClient")).getClient();
		timeLog.stop("importing zkapp client");
		toast.success('Connected to zkapp worker!');
		clientLoaded=true;
	});
	const start=async ()=>{
		timeLog.start("starting game");
		transactionPending=true;
		if(playerB)
			await client.start(playerA,playerB,fen)
		timeLog.stop("starting game");
		toast.success('Game started!');
		transactionPending=false;
		gameStarted=true;
	}
	const move=async (e:MoveEvent)=>{
		transactionPending=true;
		timeLog.start("moving piece");
			await client.move(e.detail.from,e.detail.to,e.detail.promotion as PromotionRankAsChar);
		timeLog.stop("moving piece");
		toast.success('moved piece!');
		transactionPending=false;
	}
	const offerDraw=async ()=>{
		transactionPending=true;
		timeLog.start("offering draw");
		await client.offerDraw();
		timeLog.stop("offering draw");
		toast.success('offered draw!');
		transactionPending=false;
	}
	const acceptDraw=async ()=>{
		transactionPending=true;
		timeLog.start("accepting draw");
		await client.acceptDraw();
		timeLog.stop("accepting draw");
		toast.success('accepted draw!');
		transactionPending=false;
	}
	const rejectDraw=async ()=>{
		transactionPending=true;
		timeLog.start("declining draw");
		await client.rejectDraw();
		timeLog.stop("declining draw");
		toast.success('declined draw!');
		transactionPending=false;
	}
	const resign=async ()=>{
		transactionPending=true;
		timeLog.start("resigning");
		await client.resign();
		timeLog.stop("resigning");
		toast.success('resigned!');
		transactionPending=false;
	}
	const getFEN=async ()=>{
		timeLog.start("getting state");
		const fen=await client.getFEN();
		timeLog.stop("getting state");
		toast.success('got state!');
		loadFEN(fen);
	}

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
		<Board readonly={transactionPending} {move} bind:loadFEN/>
	</div>
	<div class="slot" slot="playerB">
		<!-- TODO use custom tokens for rating -->
		<Player username={playerB} rating={'100'} />
	</div>
	<div class="slot" slot="actions">
		<div class="absolute inset-0 grid place-content-center">
		{#if !playerA}
		<p class="text-balance text-center text-lg mb-4">
			Invite someone to play with you
			<br />
			<AuroConnect let:connect>
				<button use:ripple class="button p-3" on:click={connect}> Connect </button>
			</AuroConnect>
		</p>
		{:else if !clientLoaded}
			<p class="text-balance text-center text-lg">
				Loading for <br/><b>
					zkapp worker client
				</b>
			</p>
			<div class="grid place-content-center">
				<LoaderIcon/>
			</div>
		{:else if gameStarted==false}
			{#if transactionPending}
			<p class="text-balance text-center text-lg">
				Waiting for transaction
			</p>
			<div class="grid place-content-center">
				<LoaderIcon/>
			</div>
			{:else}
				{#if playerB}
					<p class="max-w-[16rem] text-center text-lg">
						Player <b title={playerB}>{ellipsis(playerB, 18)}</b> wants to play a game
						<button use:ripple class="button mt-3" on:click={start}>Start Game</button>
					</p>
				{:else}
					<p class="text-balance text-center text-lg">
						Invite someone to play with you
						<br />
						<button use:ripple class="button mt-3" on:click={copyInviteLink}>Copy Invite Link</button>
					</p>
				{/if}
			{/if}
		{:else}
		<div class="absolute inset-1 overflow-y-scroll flex flex-col justify-start gap-1">
			<!-- <button
				use:ripple 
				class="button flex-1 whitespace-nowrap"
				
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
			<button use:ripple  class="button flex-1 whitespace-nowrap" on:click={offerDraw}> 🤝 offer draw </button>
			<button use:ripple  class="button flex-1 whitespace-nowrap" on:click={resign}> 😖 resign </button>
			<button use:ripple  class="button flex-1 whitespace-nowrap" on:click={getFEN}> 📜 get state </button>
		</div>
		{/if}
		</div>
	</div>
	<div class="slot" slot="playerA">
		<!-- TODO use custom tokens for rating -->
		<Player username={playerA} rating={'100'} />
	</div>
</DashboardLayout>

<style>
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
