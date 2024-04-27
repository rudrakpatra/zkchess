<script lang="ts">
	import AuroConnect, { publicKey } from '$lib/components/general/AuroConnect.svelte';
	import RippleButton from '$lib/components/general/RippleButton.svelte';
	import ellipsis from '$lib/ellipsis';
</script>
<main>
	<div class="flex flex-col justify-center">
		<AuroConnect let:connect>
			<RippleButton on:click={connect}>
				{#if $publicKey}
				{ellipsis($publicKey, 12)}
				{:else}
				Connect
				{/if}
			</RippleButton>
		</AuroConnect>
	</div>
</main>
<style lang="scss">
	main {
		@apply bg-background fixed inset-0  grid justify-center overflow-y-scroll p-2;
		@apply -top-1 pt-3; //prevent browser address bar from sliding up
		container-type: inline-size;
	}
</style>
