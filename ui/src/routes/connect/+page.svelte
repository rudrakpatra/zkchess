<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	import { onMount } from 'svelte';
	import toast from 'svelte-french-toast';
	import { click } from '$lib/actions/interaction';

	let mina: any;

	let publickey: string;

	const connect = async () => {
		await toast.promise<Array<string>>(
			mina.requestAccounts(),
			{
				loading: 'Connecting...',
				success: (accounts) => {
					publickey = accounts[0];
					return `Connected to ${ellipsis(publickey, 36)}`;
				},
				error: (error) => {
					return error.message;
				}
			},
			{ duration: 3000 }
		);
	};

	onMount(() => {
		mina = (window as any)?.mina;
		if (mina) toast.success(`Mina is Available!`);
		else toast.error(`Mina is not Available!`);
	});
</script>

<button use:click class="button" on:click={connect}>
	{#if publickey}
		{ellipsis(publickey, 12)}
	{:else}
		Connect
	{/if}
</button>
