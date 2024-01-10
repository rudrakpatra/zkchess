<script lang="ts">
	import { animationOnFocus } from '$lib/actions/interaction';
	import AuroConnect from '$lib/components/general/AuroConnect.svelte';
	import ellipsis from '$lib/ellipsis';
</script>

<AuroConnect let:connect let:publickey>
	<button use:animationOnFocus class="button" on:click={connect}>
		{#if publickey}
			{ellipsis(publickey, 12)}
		{:else}
			Connect
		{/if}
	</button>
</AuroConnect>
