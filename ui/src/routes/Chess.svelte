<script lang="ts">
	import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';
	import { Chess as ChessUI } from 'svelte-chess';
	import type { Move as ChessMoveUI } from 'svelte-chess/dist/api';
	import { onMount } from 'svelte';

	import ZkappWorkerClient from '$lib/zkappWorkerClient';

	onMount(async () => {
		const zkappWorkerClient = new ZkappWorkerClient();
	});
</script>

<ChessUI on:move />
