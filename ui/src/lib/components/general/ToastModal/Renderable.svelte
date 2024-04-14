<script lang="ts" context="module">
	export interface ToastModalProps{
		prompt: string;
		options: {
			label: string;
			action:()=> Promise<any>;
		}[];
	}
</script>
<script lang="ts">
	import { onMount } from 'svelte';
	import toast_ from 'svelte-french-toast';
	import type { Toast } from 'svelte-french-toast';
	import RippleButton from '../RippleButton.svelte';

	export let toast: Toast;
	let { prompt, options } = (toast as any).props as ToastModalProps;

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
			<RippleButton 
				class="flex-1"
				tabindex={1}
				bind:el={actionEls[i]}
				on:click={async () => {
					toast_.dismiss(toast.id);
					await option.action();
				}}>{option.label}
			</RippleButton>
		{/each}
	</div>
</span>
