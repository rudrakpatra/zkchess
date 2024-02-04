<script context="module" lang="ts">
	export type TimeLog = {
		start: (label: string) => void;
		stop: (label: string) => void;
	};
</script>

<script lang="ts">
	let logs = [
		{
			name: 'Logs',
			time: 0
		}
	];
	let timers: Record<string, number> = {};
	export const timeLog = {
		start: (label: string) => {
			timers[label] = performance.now();
		},
		stop: (label: string) => {
			const took = (performance.now() - timers[label]) / 1000;
			logs = [...logs,{name: label, time: took|| 0}];
		}
	};
</script>

<ul class="absolute inset-1 flex flex-col gap-1 overflow-y-scroll">
	{#each logs as log}
		<li>
			<div>
				<pre>✦</pre>
				<pre  >{log.time.toFixed(3)}s</pre>
			</div>
			<pre title={log.name}>{log.name}</pre>
		</li>
	{/each}
</ul>

<style lang="scss">
	pre {
		font-family: monospace;
		overflow-x: hidden;
	}
	li {
		@apply bg-chess-200 rounded-md p-1 text-sm;
		> div {
			@apply flex justify-between;
		}
	}
	li:after {
		content: '';
		display: block;
		height: 1px;
		width: 100%;
		background: #4444;
	}
</style>
