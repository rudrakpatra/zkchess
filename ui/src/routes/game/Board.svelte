<script lang="ts">
	import type { Move } from 'svelte-chess/dist/api';
	import { Chess } from 'svelte-chess';

	export let handleMove = (e: CustomEvent<Move>) => {
		console.warn('handleMove not implemented');
	};
	export let loadFen = (fen: string) => {
		console.warn('loadFen not implemented');
	};
</script>

<Chess on:move={handleMove} bind:load={loadFen} />
