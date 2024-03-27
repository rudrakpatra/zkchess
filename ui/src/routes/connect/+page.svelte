<script lang="ts">
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import ellipsis from '$lib/ellipsis';
	import { ripple } from 'svelte-ripple-action';
</script>

<AuroConnect let:connect>
	<button use:ripple class="button" on:click={connect}>
		{#if $publicKey}
			{ellipsis($publicKey, 12)}
		{:else}
			Connect
		{/if}
	</button>
</AuroConnect>
