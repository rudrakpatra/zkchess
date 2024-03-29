<script lang="ts">
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import RippleButton from '$lib/components/general/RippleButton.svelte';
	import ellipsis from '$lib/ellipsis';
</script>

<AuroConnect let:connect>
	<RippleButton on:click={connect}>
			{#if $publicKey}
			{ellipsis($publicKey, 12)}
			{:else}
			Connect
			{/if}
	</RippleButton>
</AuroConnect>
