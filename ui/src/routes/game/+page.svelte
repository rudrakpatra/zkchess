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
	import Loader from '$lib/components/general/Loader.svelte';
	import MatchMaker from '$lib/matchmaker/MatchMaker';
	import { PrivateKey } from 'o1js';
	import GameLoop from '$lib/core/gameLoop';
	import PlayerAgent from '$lib/core/agents/playerAgent';
	import NetworkAgent from '$lib/core/agents/networkAgent';
	import type { DataConnection } from 'peerjs';
	import HiOutlineSwitchVertical from "svelte-icons-pack/hi/HiOutlineSwitchVertical";
	import Icon from 'svelte-icons-pack/Icon.svelte';
	import type { Api as ChessgroundAPI} from 'chessground/api';
	import type { PlayerSignature } from '$lib/zkapp/ZkappWorker';
	import { PvPChessProgramProof } from 'zkchess-interactive';
	import type { workerClientAPI } from '$lib/zkapp/ZkappWorkerClient';

	export let data: PageData;
	// generate a hot wallet , not using AURO Wallet for now
	let selfPvtKey = PrivateKey.random();
	let selfPubKey = selfPvtKey.toPublicKey();
	
	let selfPubKeyBase58 = selfPubKey.toBase58();
	let opponentPubKeyBase58 = data.challenger;

	let selfRating: number;
	let opponentRating: number;

	let gameStarted = false;
	let transactionPending = false;

	let timeLog: TimeLog;
	let fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

	// MATCHMAKER
	const matchmaker = new MatchMaker();
	// WORKER
	let workerClient:workerClientAPI;
	// GAME LOOP
	const gameLoop = new GameLoop();
	let selfAgent:PlayerAgent;
	let opponentAgent:NetworkAgent;
	onMount(async () => {
		// setup worker
		timeLog.start('Worker');
		const { workerClient, awaitWorker } = await import('$lib/zkapp/ZkappWorkerClient');
		awaitWorker().then(async() => {
			const {self,opponent}=await matchmaker.matchfound();
			timeLog.start('creating starting proof');
			const startingproof  = PvPChessProgramProof.fromJSON(
				await workerClient.start(self, opponent, fen)
			) as PvPChessProgramProof;
			timeLog.stop('creating starting proof');
		});
		timeLog.stop('Worker');
		// parallely setup matchmaker 
		matchmaker.setup(fen,selfPubKey,selfPvtKey).then(async() => {
			timeLog.start('match found');
			const {self,opponent,conn} = opponentPubKeyBase58?await matchmaker.accept(opponentPubKeyBase58):await matchmaker.connect();
			opponentPubKeyBase58 = opponent.publicKey;
			timeLog.stop('match found');
			// create agents
			selfAgent = new PlayerAgent();
			opponentAgent= new NetworkAgent(conn);
		});
	});
	const start = async () => {
		timeLog.start('starting game');
		// gameLoop.start(white, black, startingproof);
		timeLog.stop('starting game');
		toast.success('Game started!');
		gameStarted = true;
	};
	const move = async (move: Move) => {
		timeLog.start('moving piece');
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
		// const fen = await client.getFEN();
		timeLog.stop('getting state');
		toast.success('got state!');
		chessgroundAPI.set({
			fen: fen
		});
	};

	const copyInviteLink = () => {
		let link = window.location.href;
		//add params to link
		link += '?challenger=' + selfPubKeyBase58;
		link += '&playAsBlack=' + !playAsBlack;
		//copy link to clipboard
		navigator.clipboard.writeText(link);
		toast.success('Copied invite link to clipboard!');
	};

	let chessgroundIsReady = false;
	let	chessgroundAPI:ChessgroundAPI;

	let playAsBlack = data.playAsBlack;

	$: if(chessgroundAPI){
		console.log('setting orientation to ',playAsBlack?'black':'white');
		chessgroundAPI.set({
			orientation: playAsBlack?'black':"white"
		});
	}
</script>

<svelte:head>
	<title>Mina zkChess game</title>
</svelte:head>

<DashboardLayout>
	<div class="slot" slot="logs">
		<Logs bind:timeLog />
	</div>
	<div class="slot" slot="board">
		<Board bind:ready={chessgroundIsReady} bind:chessgroundAPI/>
		{#if !opponentPubKeyBase58}
		<div class="playAsCheckBox">
			<input id="playAsCheckBox" type="checkbox" bind:checked={playAsBlack}>
			<label for="playAsCheckBox" >
				<Icon src={HiOutlineSwitchVertical} size="32"  />
				play as {playAsBlack ? 'white' : 'black'}
			</label>
		</div>
		{/if}
	</div>
	<div class="slot" slot="playerB">
		<!-- TODO use custom tokens for rating -->
		<Player username={opponentPubKeyBase58} rating={opponentRating} />
	</div>
	<div class="slot" slot="actions">
		<div class="absolute inset-1 grid place-content-center">
			{#if !selfPubKey}
				<p class="action">Invite someone to play with you</p>
				<AuroConnect let:connect>
					<div class="grid place-content-center">
						<button use:ripple class="button" on:click={connect}> Connect </button>
					</div>
				</AuroConnect>
				<!-- {:else if !clientLoaded}
				<p class="action">
					Compiling <b>zkapp</b>
				</p>
				<div class="grid place-content-center">
					<Loader />
				</div> -->
			{:else if gameStarted == false}
				{#if transactionPending}
					<p class="action">Transaction in Progress</p>
					<div class="grid place-content-center">
						<Loader />
					</div>
				{:else if opponentPubKeyBase58}
					<p class="action">
						Player <b title={opponentPubKeyBase58}>{ellipsis(opponentPubKeyBase58, 12)}</b>
					</p>
					<div class="grid place-content-center">
						<button use:ripple class="button" on:click={start}>Start Game</button>
					</div>
				{:else}
					<p class="action">Invite using link</p>
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
		<Player username={selfPubKeyBase58} rating={selfRating} />
	</div>
</DashboardLayout>

<style lang="scss">
	.playAsCheckBox{
		@apply absolute;
		top:50%;
		right:-10px;
		transform: translate(100% ,-50%);
		input[type="checkbox"]{
			@apply hidden;
		}
		label{
			@apply select-none cursor-pointer flex items-center gap-2;
		}
	}
	.action {
		@apply text-balance p-2 text-center text-lg;
	}
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
