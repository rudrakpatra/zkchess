<script lang="ts">
	import { dev } from '$app/environment';
	import ellipsis from '$lib/ellipsis';
	import toast from 'svelte-french-toast';
	import DashboardLayout from '../../lib/DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Player from './Player.svelte';
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import type { Move } from 'chess.js';
	import Loader from '$lib/components/general/Loader.svelte';
	import MatchMaker from '$lib/matchmaker/MatchMaker';
	import { PrivateKey } from 'o1js';
	import GameMachine from '$lib/core/GameMachine';
	import type { Api as ChessgroundAPI} from 'chessground/api';
	import type { PromotionRankAsChar } from 'zkchess-interactive';
	import type { workerClientAPI } from '$lib/zkapp/ZkappWorkerClient';
	import RippleButton from '$lib/components/general/RippleButton.svelte';

	export let data: PageData;
	const startingFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	// generate a hot wallet , not using AURO Wallet for now
	let selfPvtKey = PrivateKey.random();
	let selfPubKey = selfPvtKey.toPublicKey();
	
	let selfPubKeyBase58 = selfPubKey.toBase58();
	let opponentPubKeyBase58 = data.challenger;

	let selfRating: number;
	let opponentRating: number;
	// match maker variables
	let matchFailed = false;
	// game synchronization variables
	let gameStarted = false;

	let timeLog: TimeLog;


	// MATCHMAKER
	let matchmaker = new MatchMaker();;
	// WORKER
	let workerClient:workerClientAPI;
	// GAME MACHINE
	let gameMachine=new GameMachine(startingFen);

	onMount(async () => {
		// setup worker
		timeLog.start("Compiled Contracts");
		const { workerClient, awaitWorker } = await import('$lib/zkapp/ZkappWorkerClient');
		awaitWorker().then(async() => {
			const {self,opponent,conn}=await matchmaker.awaitMatchFound();
			gameStarted = true;
			// timeLog.start('creating starting proof');
			// const startingproof  = PvPChessProgramProof.fromJSON(
				// 	await workerClient.start(self, opponent, startingFen)
				// ) as PvPChessProgramProof;
				// timeLog.stop('creating starting proof');
			gameMachine.attachPeer(conn);
			playAsBlack?gameMachine.playAsBlack(conn):gameMachine.playAsWhite(conn);
		});
		timeLog.stop("Compiled Contracts");
		// parallely setup matchmaker 
		matchmaker.setup(startingFen,selfPubKey,selfPvtKey).then(async() => {
			try{
				timeLog.start('match found');
				const {opponent} = opponentPubKeyBase58?await matchmaker.accept(opponentPubKeyBase58):await matchmaker.connect();
				opponentPubKeyBase58 = opponent.publicKey;
				timeLog.stop('match found');
			}
			catch(e){
				console.error(e);
				matchFailed=true;
				toast.error('Match failed: '+e);
			}
		});
	});
	const offerDraw = async () => {
		timeLog.start('offering draw');

		timeLog.stop('offering draw');
		toast.success('offered draw!');
	};
	const acceptDraw = async () => {
		timeLog.start('accepting draw');
		// await client.acceptDraw();
		
		timeLog.stop('accepting draw');
		toast.success('accepted draw!');
	};
	const rejectDraw = async () => {
		timeLog.start('declining draw');
		// await client.rejectDraw();

		timeLog.stop('declining draw');
		toast.success('declined draw!');
	};
	const resign = async () => {
		timeLog.start('resigning');
		// await client.resign();

		timeLog.stop('resigning');
		toast.success('resigned!');
	};

	//_______________________________________________________________________________________

	const copyInviteLink = () => {
		let link = location.href;
		//add params to link
		link += '?challenger=' + selfPubKeyBase58;
		link += '&playAsBlack=' + !playAsBlack;
		//copy link to clipboard
		toast.promise(copyToClipboard(link),{ 	
			loading: 'Copying invite link to clipboard...',
		 	success: 'Copied invite link to clipboard!',
			error: 'Failed to copy invite link to clipboard!'
		});
	};

	function copyToClipboard(text:string) {
		if(dev){
			const textArea = document.createElement("textarea");
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.focus({preventScroll:true});
			textArea.select();
			return new Promise<void>((res,rej)=>{
				if(document.execCommand('copy'))res();
				else rej();
				document.body.removeChild(textArea);
			});
		}
		else{
			return navigator.clipboard.writeText(text);
		}
	}


	let	chessgroundAPI:ChessgroundAPI;

	let playAsBlack = data.playAsBlack;

	// $: console.log('setting orientation to ',playAsBlack?'black':'white');

	$: 	chessgroundAPI && 
		chessgroundAPI.set({
			orientation: playAsBlack?'black':"white"
		});

	let fen=startingFen;
	$: 	chessgroundAPI && gameMachine.gameState.subscribe((state) => fen=state.toFEN());

	let placeMove:any;
	$: {
		placeMove=(e:unknown)=>{
			const move=(e as any).detail as Move;
			gameMachine.placeMove(move.from,move.to,(move.promotion||'q') as PromotionRankAsChar);
		}
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
		<Board on:move={placeMove} bind:chessgroundAPI {fen} {playAsBlack} {gameStarted}/>
		{#if !opponentPubKeyBase58 && chessgroundAPI}
			<div class="absolute inset-0 grid place-content-center rounded-md bg-chess-400 bg-opacity-60 z-50">
				<p class="action">Invite someone using link</p>
				<div class="grid place-content-center">
					<RippleButton on:click={copyInviteLink}>Copy Invite Link</RippleButton>
				</div>
			</div>
		{/if}
	</div>
	<div class="slot" slot="playerB">
		<!-- TODO use custom tokens for rating -->
		<Player username={opponentPubKeyBase58} rating={opponentRating} link={"/player"} />
	</div>
	<div class="slot" slot="actions">
		<div class="absolute inset-1 grid place-content-center">
			{#if gameStarted}
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
					<RippleButton class="flex-1 w-full" on:click={offerDraw}>🤝 offer draw</RippleButton>
					<RippleButton class="flex-1 w-full" on:click={resign}>😖 resign</RippleButton>
				</div>
			{:else if opponentPubKeyBase58}
				{#if matchFailed}
					<p class="action">Match failed</p>
					<div class="grid place-content-center">
						<RippleButton on:click={()=>{location.reload()}}>Reload Page</RippleButton>
					</div>
				{:else}
					<p class="action">Waiting for opponent to accept</p>
					<div class="grid place-content-center">
						<Loader />
					</div>
				{/if}
			{:else}
				<p class="action">Switch Side</p>
				<div class="grid place-content-center">
					<RippleButton class="w-[15ch] text-center text-white">
						<input id="playAsBlackCheckBox" class="hidden" type="checkbox" bind:checked={playAsBlack}>
						<label for="playAsBlackCheckBox" class="select-none cursor-pointer" >
							Play as {playAsBlack ? 'White' : 'Black'}
						</label>
					</RippleButton>
				</div>
			{/if}
		</div>
	</div>
	<div class="slot" slot="playerA">
		<!-- TODO use custom tokens for rating -->
		<Player username={selfPubKeyBase58} rating={selfRating} link={"/player"} />
	</div>
</DashboardLayout>

<style lang="scss">
	.action {
		@apply text-balance p-2 text-center text-lg;
	}
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
