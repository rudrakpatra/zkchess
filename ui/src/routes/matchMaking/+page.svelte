<script lang="ts">
	import type { DataConnection, Peer } from 'peerjs';
	import { PrivateKey } from 'o1js';
	import { onMount } from 'svelte';

	// generate a new wallet
	const walletPrivateKey = PrivateKey.random();
	const wallet = walletPrivateKey.toPublicKey();
	console.log('Your Hot wallet', wallet.toBase58());

	let peer: Peer;
	let conn: DataConnection;
	let connected = false;
	let opponentId = '';
	let isWhite: boolean;

	onMount(async () => {
		const { Peer } = await import('peerjs');
		peer = new Peer(wallet.toBase58().toLowerCase(), {
			host: 'peerjs.92k.de', // TODO: use own peerjs server, https://github.com/Raunaque97/peerjs-server#running-in-google-app-engine
			secure: true,
			debug: 2
		});
		peer.on('error', (err) => {
			console.error('Network: Network/peer error: ' + err);
		});
		peer.on('connection', (connection) => {
			console.log(peer);
			if (connected) {
				// this can happen when a 3rd player tries to connect
				console.warn('Network: Already connected to an opponent');
				return;
			}
			conn = connection;
			connected = true;
			isWhite = true;
			console.log('Network: Connected to opponent ID', connection.peer);
		});

		const urlparams = new URLSearchParams(window.location.search);
		if (urlparams.has('id')) {
			opponentId = urlparams.get('id') as string;
			setTimeout(() => onJoin(opponentId), 1000);
		}
	});

	function onJoin(peerId: string) {
		let connection = peer.connect(peerId, { reliable: true });
		connection.on('open', () => {
			connected = true;
			conn = connection;
			console.log('connected with:', peerId);
			isWhite = false;
		});
		connection.on('error', (err) => {
			console.error('Network/peerConn, not innitiator error: ' + err);
		});
	}
</script>

<h3>share your ID with others to connect, or join using other's ID</h3>
<p>Your ID: {peer?.id}</p>
<div style="display:flex">
	<input type="text" bind:value={opponentId} />
	<button on:click={() => onJoin(opponentId)}>join</button>
</div>
