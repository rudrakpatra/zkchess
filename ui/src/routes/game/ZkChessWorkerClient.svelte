<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		const { Chess } = await import('zkchess-contracts');
	});
	let logs = ['contracts loaded', 'compiled', 'starting game', 'moving'];
</script>

<ul class="m-1 overflow-auto">
	{#each logs as log}
		<li class=" text-sm">
			<pre>{log}</pre>
		</li>
	{/each}
</ul>

<style>
	li::before {
		content: '✦';
		opacity: 0.2;
	}
	li:after {
		content: '';
		display: block;
		height: 1px;
		width: 100%;
		background: #4444;
	}
</style>
