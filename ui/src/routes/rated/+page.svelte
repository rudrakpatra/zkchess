<script lang="ts">
	import ToastModal from '$lib/components/general/ToastModal/Renderable.svelte';
	import { get } from 'svelte/store';
	import { dev } from '$app/environment';
	import ellipsis from '$lib/ellipsis';
	import toast from 'svelte-french-toast';
	import RippleButton from '$lib/components/general/RippleButton.svelte';
	import DashboardLayout from './DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Player from './Player.svelte';
	import AuroConnect, {
		mina,
		publicKey as AuroWalletKeyBase58
	} from '$lib/components/general/AuroConnect.svelte';
	import { onMount } from 'svelte';
	import type { Move } from 'chess.js';
	import Loader from '$lib/components/general/Loader.svelte';
	import MatchMaker, { PlayerConsent, type MatchInfo } from '$lib/matchmaker/MatchMaker';
	import { PrivateKey, type JsonProof, PublicKey } from 'o1js';
	import GameMachine from '$lib/core/GameMachine';
	import type { Api as ChessgroundAPI } from 'chessground/api';
	import type { workerClientAPI } from '$lib/zkapp/ZkappWorkerClient';
	import type { JsonMove } from '$lib/zkapp/ZkappWorkerDummy';
	import { type PromotionRankAsChar, PvPChessProgramProof, GameState } from 'zkchess-interactive';
	import Sync from '$lib/Sync';
	import { toastModal } from '$lib/components/general/ToastModal';
	const startingFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	// generate a hot wallet , not using AURO Wallet for now
	let selfPvtKey = PrivateKey.random();
	let selfPubKey = selfPvtKey.toPublicKey();

	let selfPubKeyBase58 = selfPubKey.toBase58();
	let opponentPubKeyBase58: string;

	let selfRating: number;
	let opponentRating: number;
	// match maker variables
	let matchFound_UI = false;
	let matchFailed_UI = false;
	// game synchronization variables
	let userCanStartPlaying = false;

	let timeLog: TimeLog;

	let drawPending = false;
	let offerDraw = async () => {
		toast.error('action not allowed!');
	};
	let acceptDraw = async () => {
		toast.error('action not allowed!');
	};
	let rejectDraw = async () => {
		toast.error('action not allowed!');
	};
	let resign = async () => {
		toast.error('action not allowed!');
	};

	let startMatchMaker = new Sync<boolean>();

	let playAsBlack: boolean;
	let chessgroundAPI: ChessgroundAPI;

	let fen = startingFen;

	let placeMove: any;
	let connectionTriesSync = new Sync<boolean>();
	connectionTriesSync.push(true);
	let gameSync = new Sync<boolean>();
	onMount(async () => {
		const [workerClient, matchInfo] = await Promise.all([
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
			new Promise<MatchInfo>(async (res, rej) => {
				try {
					const matchmaker = new MatchMaker();
					timeLog.start('MatchMaker Loaded');
					const auroWalletKeySync = new Sync<string>();
					AuroWalletKeyBase58.subscribe((x) => auroWalletKeySync.push(x));
					await auroWalletKeySync.consume();
					const content = [...selfPubKey.toFields(), ...GameState.fromFEN(startingFen).toFields()];

					const signResult = await mina.signFields({ message: content.map((x) => x.toString()) });
					if (signResult instanceof Error) {
						console.error(signResult);
						toast.error('sign failed!');
						return;
					}
					const consent = new PlayerConsent(
						get(AuroWalletKeyBase58),
						selfPubKeyBase58,
						JSON.stringify(signResult)
					);
					await matchmaker.setup();
					timeLog.stop('MatchMaker Loaded');
					while (await connectionTriesSync.consume()) {
						try {
							timeLog.start('Match found');
							const match = await toast.promise(matchmaker.findMatch(consent), {
								loading: 'Waiting for opponent',
								success: (match) => {
									opponentPubKeyBase58 = match.opponent.publicKey;
									matchFound_UI = true;
									const t = timeLog.stop('Match found').toPrecision(3);
									return 'Match found in ' + t + 's';
								},
								error: (e) => {
									matchFailed_UI = true;
									toastModal({
										prompt: e,

										options: [
											{
												label: '↻ Retry',
												action: async () => {
													connectionTriesSync.push(true);
												}
											},
											{
												label: '⟳ Reload',
												action: async () => {
													location.reload();
												}
											}
										]
									});
									return 'Match failed';
								}
							});
							if (match) {
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
		matchInfo.socket.on(
			'endGame',
			() => toast.error('Opponent disconnected') && location.assign('/')
		);
		matchInfo.socket.on('move', (data) => {
			console.log('data', data);
			typeof data === 'string' && gameSync.push(true);
		});
		playAsBlack = matchInfo.playAsBlack;
		opponentPubKeyBase58 = matchInfo.opponent.publicKey;
		const white = playAsBlack ? matchInfo.opponent : matchInfo.self;
		const black = matchInfo.playAsBlack ? matchInfo.self : matchInfo.opponent;
		timeLog.start('Generating proof');
		if (playAsBlack) await new Promise((res) => setTimeout(res, 10000));
		const startingProof = await workerClient.start(white, black, startingFen);
		timeLog.stop('Generating proof');
		const gameMachine = new GameMachine(await PvPChessProgramProof.fromJSON(startingProof));
		gameMachine.fen.subscribe((newFen) => (fen = newFen));
		//attach input
		timeLog.start('Starting game');
		placeMove = async (e: unknown) => {
			const move = (e as any).detail as Move;
			const moveJson = {
				to: move.to,
				from: move.from,
				promotion: (move.promotion || 'q') as PromotionRankAsChar
			} as JsonMove;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.move(moveJson, lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		gameMachine.onStart = () => {
			userCanStartPlaying = true;
		};
		gameMachine.onOngoing = () => {
			if (drawPending) {
				drawPending = false;
				toast.error('Draw offer withdrawn');
			}
		};
		gameMachine.onDrawOffered = () => {
			toastModal({
				prompt: 'Opponent has offered a draw',
				options: [
					{
						label: '👍 accept',
						action: () =>
							toast.promise(acceptDraw(), {
								loading: 'Accepting Draw',
								success: 'Accepted!',
								error: 'Could not accept Draw'
							})
					},
					{
						label: '👎 decline',
						action: () =>
							toast.promise(rejectDraw(), {
								loading: 'Declining Draw',
								success: 'Declined!',
								error: 'Could not decline Draw'
							})
					}
				]
			});
		};
		gameMachine.onDraw = () => {
			chessgroundAPI.set({ turnColor: undefined, movable: { color: undefined } });
			toast.success('Draw!');
		};
		gameMachine.onWin = () => {
			toast.success('Congrats You Won!');
		};
		gameMachine.onLoose = () => {
			toast.error('Oops You Lost!');
		};

		const checkTurn = () => {
			const turn = get(gameMachine.lastProof).publicOutput.turn.toBoolean();
			const myTurn = turn === !playAsBlack;
			if (!myTurn) {
				toast.error('Not Your Turn');
				return true;
			}
			return false;
		};
		//draw
		offerDraw = async () => {
			if (checkTurn()) return;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.offerDraw(lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
			drawPending = true;
		};
		acceptDraw = async () => {
			if (checkTurn()) return;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.acceptDraw(true, lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		rejectDraw = async () => {
			if (checkTurn()) return;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.acceptDraw(false, lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		//resign
		resign = async () => {
			if (checkTurn()) return;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.resign(lastProof, privateKey);
			gameMachine.local.push(PvPChessProgramProof.fromJSON(newProof));
		};
		console.log('assigned');
		matchInfo.socket.emit('move', 'setupAllCallbacks');
		await gameSync.consume();
		console.log('set move');
		matchInfo.socket.on('move', async (msg) => {
			console.log('move NEW', msg);
			if (typeof msg === 'object') {
				const jsonProof = msg as JsonProof;
				gameMachine.network.push(PvPChessProgramProof.fromJSON(jsonProof));
			}
		});
		matchInfo.socket.emit('move', 'listeningForStartingProof');
		await gameSync.consume();
		console.log('starting start');
		timeLog.stop('Starting game');
		matchInfo.socket.emit('move', startingProof);

		playAsBlack
			? gameMachine.playAsBlack(matchInfo.socket)
			: gameMachine.playAsWhite(matchInfo.socket);
	});
	$: chessgroundAPI && chessgroundAPI.set({ orientation: playAsBlack ? 'black' : 'white' });

	$: userCanStartPlaying && timeLog.stop((fen.match(' w') ? 'White' : 'Black') + "'s turn");
</script>

<svelte:head>
	<title>Mina zkChess game</title>
</svelte:head>
<!-- <svelte:window on:keydown={e => timeLog.stop('Space pressed')}/> -->
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
			gameStarted={userCanStartPlaying}
		/>
		{#if !chessgroundAPI}
			<div class="overlay">
				<p class="label">Loading Game Assets...</p>
				<div class="grid place-content-center">
					<Loader size={50} />
				</div>
			</div>
		{:else if !opponentPubKeyBase58}
			<div class="overlay">
				<p class="label">Looking for Players...</p>
				<div class="grid place-content-center">
					<Loader size={50} />
				</div>
			</div>
		{:else if !userCanStartPlaying}
			<div class="overlay">
				<p class="label">Starting Game...</p>
				<div class="grid place-content-center">
					<Loader size={50} />
				</div>
			</div>
		{/if}
	</div>
	<div class="slot" slot="playerB">
		<!-- TODO use custom tokens for rating -->
		<Player
			username={opponentPubKeyBase58}
			rating={opponentRating}
			link={`/player?key=${opponentPubKeyBase58}`}
		/>
	</div>
	<div class="slot" slot="actions">
		<div class="overlay">
			{#if matchFound_UI}
				{#if userCanStartPlaying}
					<div class="absolute inset-1 flex flex-col overflow-x-hidden overflow-y-scroll gap-1">
						<RippleButton tabindex={2} class="flex-1 w-full" on:click={offerDraw}
							>🤝 offer draw</RippleButton
						>
						<RippleButton tabindex={2} class="flex-1 w-full" on:click={resign}
							>😖 resign</RippleButton
						>
					</div>
				{:else}
					<p class="label">Setting up...</p>
					<div class="grid place-content-center">
						<RippleButton on:click={() => window.location.assign('/')}>Cancel</RippleButton>
					</div>
				{/if}
			{:else if opponentPubKeyBase58}
				{#if matchFailed_UI}
					<p class="label">Match failed</p>
					<div class="grid place-content-center">
						<RippleButton on:click={() => connectionTriesSync.push(true)}>Retry</RippleButton>
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
					<RippleButton tabindex={2} class="w-[15ch] text-center text-white">
						Play as {playAsBlack ? 'White' : 'Black'}
					</RippleButton>
				</div>
			{/if}
		</div>
	</div>
	<div class="slot" slot="playerA">
		<!-- TODO use custom tokens for rating -->
		<Player
			username={selfPubKeyBase58}
			rating={selfRating}
			link={`/player?key=${selfPubKeyBase58}`}
		/>
	</div>
</DashboardLayout>

<style lang="scss">
	.overlay {
		@apply bg-chess-400 absolute inset-0 z-50 grid place-content-center rounded-md bg-opacity-60;
	}
	.label {
		@apply text-balance p-2 text-center text-lg;
	}
	.slot {
		@apply relative h-full w-full p-1;
	}
</style>
