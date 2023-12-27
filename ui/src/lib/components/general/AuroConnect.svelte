<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	import { onMount } from 'svelte';
	import toast from 'svelte-french-toast';
	import { animationOnFocus } from '$lib/actions/interaction';
	import { createEventDispatcher } from 'svelte';
	let mina: any;

	let publickey: string;

	const connect = async () => {
		await toast.promise<Array<string>>(
			mina.requestAccounts(),
			{
				loading: 'Connecting...',
				success: (accounts) => {
					publickey = accounts[0];
					return `Connected as ${ellipsis(publickey, 36)}`;
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

	const dispatch = createEventDispatcher();

	$: publickey && dispatch('connection', { publickey });
</script>

<slot {connect} {publickey}>
	<button use:animationOnFocus class="button" on:click={connect}>
		{#if publickey}
			{ellipsis(publickey, 12)}
		{:else}
			Connect
		{/if}
	</button>
</slot>
