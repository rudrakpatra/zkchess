<script context="module" lang="ts">
	export type TimeLog = {
		start: (label: string) => void;
		stop: (label: string) => number;
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
			return took;
		}
	};
	const scrollIntoView = (node: HTMLElement) => {
		
		//calculate if fraction the parent dom rect is visible
		const parent=node.parentElement;
		if(!parent)return;
		//calculate the scroll distance of the element
		// const scrollDistance= node.offsetTop -(node.parentElement?.scrollTop || 0);
		// if(scrollDistance<200)
		node.animate([{scale:.8},{}], {duration: 150});
		node.animate([{backgroundColor: 'white'},{}], {duration: 1000});
		parent.scrollBy({top: node.offsetTop, behavior: 'smooth'});
	};
</script>

<ul class="absolute inset-1 flex flex-col gap-1 overflow-y-scroll">
	{#each logs as log,i}	
		{#if i == logs.length - 1}
			<li use:scrollIntoView>
				<div>
					<pre>✦{i}</pre>
					<pre>{log.time.toFixed(3)}s</pre>
				</div>
				<pre title={log.name}>{log.name}</pre>
			</li>
		{:else}
			<li>
				<div>
					<pre>✦{i}</pre>
					<pre>{log.time.toFixed(3)}s</pre>
				</div>
				<pre title={log.name}>{log.name}</pre>
			</li>
		{/if}
	{/each}
</ul>

<style lang="scss">
	ul{
		scroll-behavior: smooth;
	}
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
