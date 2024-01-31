<script lang="ts">
	import { onMount } from 'svelte';
	import { getAccount, publicKey } from '$lib/components/general/AuroConnect.svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';

	onMount(async () => {
		if (!get(publicKey)) await getAccount();
		if (!get(publicKey)) goto('/');
	});
</script>

<slot />
