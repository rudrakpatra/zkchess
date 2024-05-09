<script lang="ts">
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	// import { dev } from '$app/environment';
	// import ellipsis from '$lib/ellipsis';
	import toast from 'svelte-french-toast';
	import RippleButton from '$lib/components/general/RippleButton.svelte';
	import DashboardLayout from './DashboardLayout.svelte';
	import Logs, { type TimeLog } from './Logs.svelte';
	import Board from './Board.svelte';
	import Player from './Player.svelte';
	import {mina,publicKey as AuroWalletKeyBase58} from '$lib/components/general/AuroConnect.svelte';
	import { onMount } from 'svelte';
	import type { Move } from 'chess.js';
	import Loader from '$lib/components/general/Loader.svelte';
	import MatchMaker, { PlayerConsent, type MatchInfo } from '$lib/matchmaker/MatchMaker';
	import { PrivateKey, type JsonProof } from 'o1js';
	import GameMachine from '$lib/core/GameMachine';
	import type { Api as ChessgroundAPI } from 'chessground/api';
	import type { workerClientAPI } from '$lib/zkapp/ZkappWorkerClient';
	import type { JsonMove } from '$lib/zkapp/ZkappWorkerDummy';
	import { type PromotionRankAsChar, PvPChessProgramProof, GameState,DEFAULT_PRECISION } from 'zkchess-interactive';
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
	let userHasSigned = false;
	let userCanStartPlaying = false;
	let gameHasEnded=false;


	let timeLog: TimeLog;

	let drawOffered=false;
	let drawOfferResultSync = new Sync<boolean>();
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
	let submit = async () => {
		toast.error('action not allowed!');
	};
	let playAsBlack: boolean;
	let chessgroundAPI: ChessgroundAPI;

	let fen = startingFen;

	let placeMove: any;
	let consentTriesSync = new Sync<boolean>();
	consentTriesSync.push(true);
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
					workerClient.getRating(get(AuroWalletKeyBase58)).then((rating) => {
						selfRating = Number(rating)/10 ** DEFAULT_PRECISION;
					});

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

					let consent:PlayerConsent|null=null;
					while(await consentTriesSync.consume()){
						try{
							//signing the consent
							const content = [...selfPubKey.toFields(), ...GameState.fromFEN(startingFen).toFields()];
							const signResult = await mina.signFields({ message: content.map((x) => x.toString()) });
							if (signResult instanceof Error) {
								toast.error('sign failed!');
								console.error(signResult);
								return;
							}
							consent = new PlayerConsent(
								get(AuroWalletKeyBase58),
								selfPubKeyBase58,
								JSON.stringify(signResult)
							);
						}
						catch(e){
							//inform user consent failed
							consent=null;
							console.error(e);
							toast.error('sign failed!');
						}
						finally{
							//done
							if(consent)break;
							//retry
							toastModal({
								prompt: "You must sign a consent to play!",
								options: [
									{
										label: '↻ Retry',
										action: async () => {
											consentTriesSync.push(true);
										}
									}
								]
							});
						}
					}
					userHasSigned = true;
					//TODO: use env variable but vercel is shitty with env variables
					const server="http://steel-wharf-422500-a0.el.r.appspot.com/"
					await matchmaker.setup(server);
					
					timeLog.stop('MatchMaker Loaded');
					timeLog.start('Match found');
					const match = await toast.promise(matchmaker.findMatch(consent!), {
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
											label: '⟳ Reload Page',
											action: async () => {
												location.reload();
											}
										}
									]
								});
								return 'Match failed';
							}
					});
					match && res(match);
				} catch (e) {
					console.error(e);
					matchFound_UI = false;
					rej(e);
				}
			})
		]);
		matchInfo.socket.once(
			'endGame',
			() => toastModal({
				prompt:'Opponent has left the match',
				options: [
					{
						label: 'Exit',
						action: async()=>location.assign('/')
					}
				]
			})
		);
		matchInfo.socket.on('move', (data) => {
			typeof data === 'string' && gameSync.push(true);
		});
		playAsBlack = matchInfo.playAsBlack;
		opponentPubKeyBase58 = matchInfo.opponent.publicKey;
		//set opponent rating
		workerClient.getRating(opponentPubKeyBase58).then((rating) => {
			opponentRating = Number(rating)/10 ** DEFAULT_PRECISION;
		});
		// set white and black
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
			gameMachine.local.push(await PvPChessProgramProof.fromJSON(newProof));
		};
		gameMachine.onStart = () => {
			userCanStartPlaying = true;
		};
		gameMachine.onOngoing = () => {
			if(drawOffered){
				//its revoked
				drawOffered=false;
				drawOfferResultSync.push(false);
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
			if(!drawOffered)throw new Error('Draw not offered');
			if(drawOffered){
				//its accepted
				drawOffered=false;
				drawOfferResultSync.push(true);
				gameHasEnded=true;
			}
		};
		gameMachine.onWin = () => {
			toast.success('Congrats You Won!');
			gameHasEnded=true;
		};
		gameMachine.onLoose = () => {
			toast.error('Oops You Lost!');
			gameHasEnded=true;
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
			drawOffered=true;
			gameMachine.local.push(await PvPChessProgramProof.fromJSON(newProof));
			toast.promise(
				new Promise<void>(async (res,rej)=>await drawOfferResultSync.consume()?res():rej()),
				{
					loading: 'Waiting for opponent ...',
					success: 'Drawed!',
					error: 'Opponent denied your offer'
				}
			);
		};
		acceptDraw = async () => {
			if (checkTurn()) return;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.acceptDraw(true, lastProof, privateKey);
			gameMachine.local.push(await PvPChessProgramProof.fromJSON(newProof));
		};
		rejectDraw = async () => {
			if (checkTurn()) return;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.acceptDraw(false, lastProof, privateKey);
			gameMachine.local.push(await PvPChessProgramProof.fromJSON(newProof));
		};
		//resign
		resign = async () => {
			if (checkTurn()) return;
			const lastProof = get(gameMachine.lastProof).toJSON();
			const privateKey = selfPvtKey.toBase58();
			const newProof = await workerClient.resign(lastProof, privateKey);
			gameMachine.local.push(await PvPChessProgramProof.fromJSON(newProof));
		};
		submit = async () => {
			// const registerTransactionJSON= await workerClient.createrRegisterTransactionJSON(selfPubKeyBase58);
			// console.log({registerTransactionJSON});
			// const provedRegisterTransactionJSON=await workerClient.proveTransaction(registerTransactionJSON);
			// console.log({provedRegisterTransactionJSON});
			// //wait for auro wallet to sign
			// const sentTransaction=await mina.sendTransaction({
			// 	transaction: provedRegisterTransactionJSON,
			// 	feePayer: {
			// 		fee: 0.1,
			// 		memo: 'register on zkchess',
			// 	},
			// });
			// console.log({sentTransaction});

			// if(sentTransaction instanceof Error){
			// 	toast.error('Submission failed');
			// 	console.error(sentTransaction);
			// 	return;
			// }
			// const proof= get(gameMachine.lastProof).toJSON();
			// console.log({proof});
			// const submissionJSON=await workerClient.createSubmitTransaction(proof);
			// console.log({submissionJSON});
			// const provedSubmissionJSON=await workerClient.proveTransaction(submissionJSON);
			// console.log({provedSubmissionJSON});
			// const sentSubmissionTransaction=await mina.sendTransaction({
			// 	transaction: provedSubmissionJSON,
			// 	feePayer: {
			// 		fee: 0.1,
			// 		memo: 'submission for match result',
			// 	},
			// });
			// console.log({sentSubmissionTransaction});

			// if(sentSubmissionTransaction instanceof Error){
			// 	toast.error('Submission failed');
			// 	console.error(sentSubmissionTransaction);
			// 	return;
			// }
			// //transaction success
			// const txnHash=sentSubmissionTransaction.hash;
			const txnHash='TODO';
			const transactionLink = `https://minascan.io/devnet/tx/${txnHash}`;
			toast.success(`View transaction at ${transactionLink}`);
			console.log(`View transaction at ${transactionLink}`);
			//update rating
			const newRating=await workerClient.getRating(selfPubKeyBase58);
			selfRating = Number(newRating)/10 ** DEFAULT_PRECISION;
			toastModal({
				prompt:'Rating updated to '+selfRating,
				options: [
					{
						label: 'Play Again',
						action: async()=>location.assign('/game?rated=true')
					},
					{
						label: 'Exit',
						action: async()=>{
							location.assign('/');
						}
					}
				]
			});
		};
		matchInfo.socket.emit('move', 'setupAllCallbacks');
		await gameSync.consume();
		matchInfo.socket.on('move', async (msg) => {
			if (typeof msg === 'object') {
				const jsonProof = msg as JsonProof;
				gameMachine.network.push(await PvPChessProgramProof.fromJSON(jsonProof));
			}
		});
		matchInfo.socket.emit('move', 'listeningForStartingProof');
		await gameSync.consume();
		timeLog.stop('Starting game');
		matchInfo.socket.emit('move', startingProof);

		playAsBlack
			? gameMachine.playAsBlack(matchInfo.socket)
			: gameMachine.playAsWhite(matchInfo.socket);
	});
	$: chessgroundAPI && chessgroundAPI.set({ orientation: playAsBlack ? 'black' : 'white' });

	$: userCanStartPlaying && !gameHasEnded && timeLog.stop((fen.match(' w') ? 'White' : 'Black') + "'s turn");

	let rated=$page.url.searchParams.get('rated');
	$:gameHasEnded &&  toastModal({
		prompt:'Game Has Ended',
		options: rated?
		[
			{
				label: 'Exit',
				action: async()=>location.assign('/')
			},
			{
				label: 'Submit',
				action: async()=>{
					await submit();
				}
			}
		]:
		[
			{
				label: 'Exit',
				action: async()=>location.assign('/')
			},
			{
				label: 'Play Again',
				action: async()=>location.assign('/game?rated=true')
			}
		]
	});
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
		disabled={gameHasEnded}
		/>
		{#if !chessgroundAPI}
			<div class="overlay">
				<p class="label">Loading Game Assets...</p>
				<div class="grid place-content-center">
					<Loader size={50} />
				</div>
			</div>
		{:else if !userHasSigned}
			<div class="overlay">
				<p class="label">Waiting for Signature</p>
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
			publicKeybase58={opponentPubKeyBase58}
			rating={opponentRating}
		/>
	</div>
	<div class="slot" slot="actions">
		<div class="overlay">
			{#if userHasSigned}
				{#if userCanStartPlaying}
					<div class="absolute inset-1 flex flex-col overflow-x-hidden overflow-y-scroll gap-1">
						<RippleButton on:click={offerDraw} tabindex={2} class="flex-1 w-full">
							🤝 offer draw
						</RippleButton>

						<RippleButton on:click={resign} tabindex={2} class="flex-1 w-full">
							😖 resign
						</RippleButton>
					</div>
				{:else}
					<p class="label">Setting up...</p>
					<div class="grid place-content-center">
						<RippleButton on:click={() => location.assign('/')}>Cancel</RippleButton>
					</div>
				{/if}
			{:else if opponentPubKeyBase58}
				{#if matchFailed_UI}
					<p class="label">Match failed</p>
					<div class="grid place-content-center">
						<RippleButton on:click={() => consentTriesSync.push(true)}>Sign Consent</RippleButton>
					</div>
				{:else}
					<p class="label">Waiting for opponent to accept</p>
					<div class="grid place-content-center">
						<Loader />
					</div>
				{/if}
			{:else}
				<p class="label">Actions appear here once the game starts</p>
			{/if}
		</div>
	</div>
	<div class="slot" slot="playerA">
		<!-- TODO use custom tokens for rating -->
		<Player
			publicKeybase58={selfPubKeyBase58}
			rating={selfRating}
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
