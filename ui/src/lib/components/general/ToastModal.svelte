<script lang="ts">
	import { onMount } from 'svelte';
	import toast_ from 'svelte-french-toast';
	import type { Toast } from 'svelte-french-toast';
	import { ripple } from 'svelte-ripple-action';

	export let toast: Toast;
	let { prompt, options } = (toast as any).props;

	let actionEls = [] as HTMLButtonElement[];
	onMount(() => {
		actionEls[0].focus();
	});
</script>

<span>
	<div class=" text-xl p-2">
		{prompt}
	</div>
	<div class="flex gap-1">
		{#each options as option, i}
			<button
				use:ripple
				bind:this={actionEls[i]}
				class="button flex-1"
				on:click={() => {
					option.action();
					toast_.dismiss(toast.id);
				}}>{option.label}</button
			>
		{/each}
	</div>
</span>
