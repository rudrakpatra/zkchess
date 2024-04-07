<script lang="ts">
	import { get } from 'svelte/store';
	import { dev } from '$app/environment';
	import ellipsis from '$lib/ellipsis';
	import toast from 'svelte-french-toast';
	import RippleButton from '$lib/components/general/RippleButton.svelte';
	import DashboardLayout from './DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Player from './Player.svelte';
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import type { Move } from 'chess.js';
	import Loader from '$lib/components/general/Loader.svelte';
	import MatchMaker, { type MatchFound } from '$lib/matchmaker/MatchMaker';
	import { PrivateKey, type JsonProof } from 'o1js';
	import GameMachine from '$lib/core/GameMachine';
	import type { Api as ChessgroundAPI } from 'chessground/api';
	import type { workerClientAPI } from '$lib/zkapp/ZkappWorkerClient';
	import type { JsonMove } from '$lib/zkapp/ZkappWorkerDummy';
	import {
		type PromotionRankAsChar,
		PvPChessProgramProof
	} from 'zkchess-interactive';
	import Sync from '$lib/Sync';

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
	let matchFound_UI = false;
	let matchFailed_UI = false;
	// game synchronization variables
	let gameStarted_UI = false;

	let timeLog: TimeLog;

	let offerDraw = async () => {
		timeLog.start('offering draw');
		timeLog.stop('offering draw');
		toast.success('offered draw!');
	};
	let acceptDraw = async () => {
		timeLog.start('accepting draw');
		// await client.acceptDraw();

		timeLog.stop('accepting draw');
		toast.success('accepted draw!');
	};
	let rejectDraw = async () => {
		timeLog.start('declining draw');
		// await client.rejectDraw();

		timeLog.stop('declining draw');
		toast.success('declined draw!');
	};
	let resign = async () => {
		timeLog.start('resigning');
		// await client.resign();

		timeLog.stop('resigning');
		toast.success('resigned!');
	};

	//_______________________________________________________________________________________
	let startPeer = new Sync<boolean>();
	let linkCopied=false;
	const copyInviteLink = () => {
		let link = location.href;
		//add params to link
		link += '?challenger=' + selfPubKeyBase58;
		link += '&playAsBlack=' + !playAsBlack;
		//copy link to clipboard
		toast.promise(copyToClipboard(link), {
			loading: 'Copying invite link to clipboard...',
			success: 'Copied invite link to clipboard!',
			error: 'Failed to copy invite link to clipboard!'
		});
		startPeer.push(true);
		linkCopied=true;
	};

	function copyToClipboard(text: string) {
		if (dev) {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.focus({ preventScroll: true });
			textArea.select();
			return new Promise<void>((res, rej) => {
				if (document.execCommand('copy')) res();
				else rej();
				document.body.removeChild(textArea);
			});
		} else {
			return navigator.clipboard.writeText(text);
		}
	}

	let chessgroundAPI: ChessgroundAPI;

	let playAsBlack = data.playAsBlack;
	const trySwitchingSide = () => {
		if(linkCopied){
			toast.error('Cannot switch sides now');
		}
		else{
			playAsBlack = !playAsBlack;
			const msg='Switched to '+(playAsBlack ? 'Black' : 'White');
			toast.success(msg);
		}
	};
	let fen = startingFen;

	let placeMove: any;
	let connectionTries = new Sync<boolean>();
	connectionTries.push(true);
	onMount(async () => {
		chessgroundAPI.set({ orientation: playAsBlack ? 'black' : 'white' });
		const [workerClient, matchFound] = await Promise.all([
			new Promise<workerClientAPI>(async (res, rej) => {
				try {
					timeLog.start('Imported Contracts');
					const { workerClient, awaitWorker } = await import('$lib/zkapp/ZkappWorkerClient');
					timeLog.stop('Imported Contracts');

					timeLog.start('Compiled Contracts');
					await awaitWorker();
					timeLog.stop('Compiled Contracts');

					res(workerClient);
				} catch (e) {
					console.error(e);
					toast.error('Worker failed');
					rej(e);
				}
			}),
			new Promise<MatchFound>(async (res, rej) => {
				try {
					const matchmaker = new MatchMaker();
					timeLog.start('MatchMaker Loaded');
					await matchmaker.setup(startingFen, selfPubKey, selfPvtKey);
					timeLog.stop('MatchMaker Loaded');

					timeLog.start('Match found');

					while (await connectionTries.consume()) {
						try {
							!opponentPubKeyBase58 && await startPeer.consume()
							const match = await toast.promise(
								opponentPubKeyBase58
									? matchmaker.accept(opponentPubKeyBase58)
									: matchmaker.connect(),
								{
									loading: 'Waiting for opponent',
									success: (match) => {
										opponentPubKeyBase58 = match.opponent.publicKey;
										matchFound_UI = true;
										const t = timeLog.stop('Match found').toPrecision(3);
										return 'Match found in ' + t + 's';
									},
									error: (e) => {
										matchFailed_UI = true;
										return 'Match failed';
									}
								}
							);
							if (match) {
								match.conn.removeAllListeners();
								res(match);
								break;
							}
						} catch (e) {
							continue;
						}
					}
				} catch (e) {
					console.error(e);
					matchFound_UI = false;
					rej(e);
				}
			})
		]);

		const white = playAsBlack ? matchFound.opponent : matchFound.self;
		const black = playAsBlack ? matchFound.self : matchFound.opponent;

		timeLog.start('Generated starting proof');
		const startingProof = await workerClient.start(white, black, startingFen);
		timeLog.stop('Generated starting proof');

		const gameMachine = new GameMachine(PvPChessProgramProof.fromJSON(startingProof));

		gameMachine.fen.subscribe((newFen) => (fen = newFen));
		//attach peer
		matchFound.conn.on('data', (msg) => {
			const jsonProof = msg as JsonProof;
			gameMachine.network.push(PvPChessProgramProof.fromJSON(jsonProof));
		});
		//attach input
		placeMove = async (e: unknown) => {
			const move = (e as any).detail as Move;
			const moveJson ={
				to:move.to,
				from:move.from,
				promotion:(move.promotion || 'q') as PromotionRankAsChar
			} as JsonMove;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.move(moveJson, lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		//draw
		offerDraw = async () => {
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.offerDraw(lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		acceptDraw = async () => {
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.acceptDraw(true,lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		rejectDraw = async () => {
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.acceptDraw(false,lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		//resign
		resign = async () => {
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.resign(lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};

		gameStarted_UI = true;

		playAsBlack
			? gameMachine.playAsBlack(matchFound.conn)
			: gameMachine.playAsWhite(matchFound.conn);
	});
	$: chessgroundAPI && chessgroundAPI.set({ orientation: playAsBlack ? 'black' : 'white' });

	$:gameStarted_UI && timeLog.stop((fen.match(" w")?"White":"Black")+'s turn');
</script>

<svelte:head>
	<title>Mina zkChess game</title>
</svelte:head>

<DashboardLayout>
	<div class="slot" slot="logs">
		<Logs bind:timeLog />
	</div>
	<div class="slot" slot="board">
		<Board
			on:move={placeMove}
			bind:chessgroundAPI
			{fen}
			{playAsBlack}
			gameStarted={gameStarted_UI}
		/>
		{#if !opponentPubKeyBase58 && chessgroundAPI}
			<div
				class="absolute inset-0 grid place-content-center rounded-md bg-chess-400 bg-opacity-60 z-50"
			>
				<p class="label">Invite someone using link</p>
				<div class="grid place-content-center">
					<RippleButton on:click={copyInviteLink}>Copy Invite Link</RippleButton>
				</div>
			</div>
		{/if}
	</div>
	<div class="slot" slot="playerB">
		<!-- TODO use custom tokens for rating -->
		<Player username={opponentPubKeyBase58} rating={opponentRating} link={'/player'} />
	</div>
	<div class="slot" slot="actions">
		<div class="absolute inset-1 grid place-content-center">
			{#if matchFound_UI}
				{#if gameStarted_UI}
					<div class="absolute inset-0 flex flex-col overflow-x-hidden overflow-y-scroll gap-1">
						<!-- <button
								use:ripple 
								class="button flex-1"
					
								on:click={() => {
									toast(ToastModal, {
										props: {
											prompt: 'opponent has offered a draw',
											options: [
												{ label: '👍 accept', label: () => toast.success('accepted draw') },
												{ label: '👎 decline', label: () => toast.error('declined draw') }
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
				{:else}
					<p class="label">Starting Game...</p>
					<div class="grid place-content-center">
						<Loader />
					</div>
				{/if}
			{:else if opponentPubKeyBase58}
				{#if matchFailed_UI}
					<p class="label">Match failed</p>
					<div class="grid place-content-center">
						<RippleButton on:click={() => connectionTries.push(true)}>Retry</RippleButton>
					</div>
				{:else}
					<p class="label">Waiting for opponent to accept</p>
					<div class="grid place-content-center">
						<Loader />
					</div>
				{/if}
			{:else}
				<p class="label">Switch Side</p>
				<div class="grid place-content-center">
					<RippleButton on:click={trySwitchingSide} class="w-[15ch] text-center text-white">
						Play as {playAsBlack ? 'White' : 'Black'}
					</RippleButton>
				</div>
			{/if}
		</div>
	</div>
	<div class="slot" slot="playerA">
		<!-- TODO use custom tokens for rating -->
		<Player username={selfPubKeyBase58} rating={selfRating} link={'/player'} />
	</div>
</DashboardLayout>

<style lang="scss">
	.label {
		@apply text-balance p-2 text-center text-lg;
	}
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
