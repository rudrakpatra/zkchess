<script lang="ts">
	import { onMount } from 'svelte';
	import { autoConnect } from '$lib/components/general/AuroConnect.svelte';

	onMount(async () => {
		autoConnect();
	});
</script>

<slot />
