<script lang="ts">
	import { twMerge } from 'tailwind-merge'
    import { ripple } from 'svelte-ripple-action';
	export let el:HTMLButtonElement|undefined=undefined;
</script>
<button bind:this={el} use:ripple on:click {...$$restProps}
class={ 
	twMerge(
		`
		block w-fit relative select-none whitespace-nowrap\
		rounded-lg shadow-lg outline-none\
		p-2 text-lg font-semibold\
		bg-secondary text-background\
		ring-4 ring-inset ring-secondary\
		transition-colors focus-visible:bg-white/50 focus-visible:text-black\
		disabled:opacity-50 disabled:pointer-events-none\
		`,
		$$restProps.class
	)
}>
    <slot/>
</button>