<script context="module" lang="ts">
	export let mina: any;
	export const publicKey = writable<string>();
	export const getAccount = async () => {
		mina = (window as any)?.mina;
		if (!mina) {
			toast.error(`Mina is not Available!`);
			return;
		}
		await toast.promise<Array<string>>(
			mina.getAccounts(),
			{
				loading: 'Getting Accounts...',
				success: (accounts) => {
					publicKey.set(accounts[0]);
					if (Array.isArray(accounts)) return `Found account ${ellipsis(get(publicKey), 36)}`;
					return 'No accounts found';
				},
				error: (error) => {
					return 'No accounts connected';
				}
			},
			{ duration: 3000 }
		);
	};
</script>

<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	import { onMount } from 'svelte';
	import toast from 'svelte-french-toast';
	import { createEventDispatcher } from 'svelte';
	import { get, writable } from 'svelte/store';
	import { ripple } from 'svelte-ripple-action';

	const connect = async () => {
		await toast.promise<Array<string>>(
			mina.requestAccounts(),
			{
				loading: 'Connecting...',
				success: (accounts) => {
					publicKey.set(accounts[0]);
					return `Connected as ${ellipsis(get(publicKey), 36)}`;
				},
				error: (error) => {
					return error.message;
				}
			},
			{ duration: 3000 }
		);
	};

	const dispatch = createEventDispatcher();
	onMount(async () => {
		mina = (window as any)?.mina;
		if (mina) toast.success(`Mina is Available!`);
		else toast.error(`Mina is not Available!`);
	});

	$: $publicKey && dispatch('connection', { publicKey });
</script>

<slot {connect}>
	<button 
		use:ripple
	 	class="button" on:click={connect}>
		{#if $publicKey}
			{ellipsis($publicKey, 12)}
		{:else}
			Connect
		{/if}
	</button>
</slot>
