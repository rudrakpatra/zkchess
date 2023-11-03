<script lang="ts">
	import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import { type Chess, ChessMove } from '../../../contracts/build/src';

	let disableMove = true;

	let msg = 'Open the console for msgs. Press init ';
	$: console.log('msg:', msg);

	let deployerAccount: PublicKey,
		deployerKey: PrivateKey,
		whitePlayerAccount: PublicKey,
		whitePlayerKey: PrivateKey,
		blackPlayerAccount: PublicKey,
		blackPlayerKey: PrivateKey,
		zkAppAddress: PublicKey,
		zkAppPrivateKey: PrivateKey,
		zkApp: Chess;

	// _____________________________________
	const switchPlayer = (e: CustomEvent<ChessMoveUI>) => {
		return e.detail.color === 'w'
			? { playerAccount: whitePlayerAccount, playerKey: whitePlayerKey }
			: { playerAccount: blackPlayerAccount, playerKey: blackPlayerKey };
	};
	// _____________________________________

	let proofsEnabled = true;
	const init = async () => {
		msg = 'importing contract...';
		const { Chess } = await import('../../../contracts/build/src');

		msg = 'compiling...';
		await Chess.compile();
		msg = 'compiled!';

		msg = 'setting up local blockchain...';
		const Local = Mina.LocalBlockchain({ proofsEnabled });
		Mina.setActiveInstance(Local);
		({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
		({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } = Local.testAccounts[1]);
		({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } = Local.testAccounts[2]);

		zkAppPrivateKey = PrivateKey.random();
		zkAppAddress = zkAppPrivateKey.toPublicKey();
		msg = 'setting up zkApp...';
		zkApp = new Chess(zkAppAddress);

		msg = 'setting up zkApp deploy transaction...';
		const deployTxn = await Mina.transaction(deployerAccount, () => {
			AccountUpdate.fundNewAccount(deployerAccount);
			zkApp.deploy();
		});
		msg = 'proving transaction...';
		await deployTxn.prove();
		// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
		msg = 'signing transaction...';
		await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
		msg = 'deployed! press start';
	};
	const start = async () => {
		msg = 'starting the game';
		const startTxn = await Mina.transaction(whitePlayerAccount, () => {
			zkApp.start(whitePlayerAccount, blackPlayerAccount);
		});
		msg = 'proving transaction...';
		await startTxn.prove();
		msg = 'signing transaction...';
		await startTxn.sign([whitePlayerKey]).send();
		msg = 'game started!';
		console.log('gamestate:', zkApp.getGameState().toString());
		disableMove = false;
	};

	const move = async (e: CustomEvent<ChessMoveUI>) => {
		disableMove = true;
		msg = 'moving...';
		const { playerAccount, playerKey } = switchPlayer(e);
		const txn = await Mina.transaction(playerAccount, () => {
			zkApp.move(ChessMove.fromLAN(e.detail.from, e.detail.to));
		});
		msg = 'proving transaction...';
		await txn.prove();
		msg = 'signing transaction...';
		await txn.sign([playerKey]).send();
		msg = 'moved!';
		disableMove = false;
	};

	const draw = async () => {
		disableMove = true;
		msg = 'drawing...';
	};
	const resign = async () => {
		disableMove = true;
		msg = 'resigning...';
	};
	const getState = async () => {
		disableMove = true;
		msg = 'getting state...';
		console.log('gamestate:', zkApp.getGameState().toString());
		disableMove = false;
	};
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>
<main class="flex-container">
	<div id="chess-container">
		{#if disableMove}
			<div class="overlay">
				<div class="list">
					<p class="msg">{msg}</p>
				</div>
			</div>
		{/if}
		<ChessUI on:move={move} />
	</div>
	<div class="list">
		<p>zkChess</p>
		<hr />
		<button on:click={init}>init</button>
		<button on:click={start}>start</button>
		<button on:click={draw}>draw</button>
		<button on:click={resign}>resign</button>
		<button on:click={getState}>get onchain state</button>
	</div>
</main>

<style>
	p {
		font-size: 1.2rem;
		padding: 0.2rem;
	}
	.msg {
		background-color: #eee;
		border-radius: 0.2rem;
		width: 40ch;
	}
	.flex-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
	}
	#chess-container {
		position: relative;
		max-width: 600px;
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
		max-width: 600px;
		display: flex;
		justify-content: start;
		flex-direction: row;
		gap: 0.5rem;
		background-color: #eee;
		padding: 0.5rem 0.5rem;
		border-radius: 0.2rem;
	}
</style>
