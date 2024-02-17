<script lang="ts">
	import type { Move } from 'svelte-chess/dist/api';
	import { Chess } from 'svelte-chess';

	export let readonly = false;
	export let move = (e: CustomEvent<Move>) => {
		console.warn('handleMove not implemented');
	};
	export let loadFEN = (fen: string) => {
		console.warn('loadFen not implemented');
	};
</script>

<div class:readonly>
	<Chess on:move={move} bind:load={loadFEN} />
</div>
<style>
	.readonly {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
