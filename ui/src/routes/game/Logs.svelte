<script lang="ts">
	export let logs = ['Logs'];
</script>

<ul class="flex flex-col gap-1 overflow-y-scroll">
	{#each logs as log}
		<li class=" text-sm bg-chess-200 p-1 rounded-md">
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
