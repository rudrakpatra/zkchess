<script>
	import { onMount } from 'svelte';
	import { Mina, PublicKey } from 'o1js';
	import Chess from './Chess.svelte';

	onMount(async () => {
		const { Chess } = await import('../../../contracts/build/src/Chess.js');
		// Update this to use the address (public key) for your zkApp account.
		// To try it out, you can try this address for an example "Add" smart contract that we've deployed to
		// Berkeley Testnet B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA .
		const zkAppAddress = '';
		// This should be removed once the zkAppAddress is updated.
		// if (!zkAppAddress) {
		// 	console.error(
		// 		'The following error is caused because the zkAppAddress has an empty string as the public key. Update the zkAppAddress with the public key for your zkApp account, or try this address for an example "Add" smart contract that we deployed to Berkeley Testnet: B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA'
		// 	);
		// }
		//const zkApp = new Add(PublicKey.fromBase58(zkAppAddress))
	});
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>
<main>
	<div class="flex-container">
		<div id="chess-container">
			<Chess />
		</div>
		<div id="list">
			<h1>zkChess</h1>
			<p>
				You play a move. Move validity proof is generated and a transaction is made. You will get
				notified when the transaction is done.
			</p>
			<button>get onchain state</button>
		</div>
	</div>
</main>

<style>
	main {
		display: grid;
		place-content: center;
		width: 100vw;
		height: 100vh;
	}
	.flex-container {
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}
	#chess-container {
		width: 600px;
		height: 600px;
	}
	#list {
		width: 400px;
		height: 300px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background-color: #eee;
		padding: 0.25rem 0.5rem;
		border-radius: 0.5rem;
	}
	#list button {
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: none;
		background-color: #aca;
		width: fit-content;
	}
	#list button:hover {
		background-color: #bdb;
	}
	#list button:active {
		background-color: #9b9;
	}
</style>
