<script lang="ts">
	import { onMount } from 'svelte';
	import { getAccount, publicKey } from '$lib/components/general/AuroConnect.svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { browser } from '$app/environment';
	import twExtend from "$lib/twExtend";
	const browserThemeColor = (browser && twExtend.colors.background )|| null;

	onMount(async () => {
		if (!get(publicKey)) await getAccount();
		if (!get(publicKey)) goto('/');
	});
</script>

<svelte:head>
	<meta name="theme-color" content={browserThemeColor}/>
</svelte:head>
<slot />
