<script lang="ts">
	export let logs = ['Logs'];
</script>

<ul class="absolute inset-1 flex flex-col gap-1 overflow-y-scroll">
	{#each logs as log}
		<li>
			<pre>{log}</pre>
		</li>
	{/each}
</ul>

<style>
	pre {
		font-family: monospace;
	}
	li {
		@apply bg-chess-200 rounded-md p-1 text-sm;
	}
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
