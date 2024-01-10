<script lang="ts">
	import { animationOnFocus } from '$lib/actions/interaction';
	import toast_ from 'svelte-french-toast';
	import type { Toast } from 'svelte-french-toast';

	export let toast: Toast;
	let { prompt, options } = (toast as any).props;
</script>

<span>
	<div class=" text-xl p-2">
		{prompt}
	</div>
	<div class="flex">
		{#each options as option}
			<button
				class="button flex-1"
				use:animationOnFocus
				on:click={() => {
					option.action();
					toast_.dismiss(toast.id);
				}}>{option.label}</button
			>
		{/each}
	</div>
</span>
