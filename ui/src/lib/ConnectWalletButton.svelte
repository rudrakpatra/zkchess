<script lang="ts">
	import { SvelteComponent, onMount } from 'svelte';
	import toast from 'svelte-french-toast';
	let mina: any = null;
	onMount(() => {
		mina = (window as any).mina;
		if (typeof mina === 'undefined') {
			toast.error('Auro Wallet Extension Not Installed');
		} else {
			toast.success('Auro Wallet Extension Installed');
		}
	});

	const handleConnect = async () => {
		await toast
			.promise(mina.requestAccounts(), {
				loading: 'Connecting...',
				success: 'Connected!',
				error: (error) => error.message
			})
			.catch((err: any) => err);
	};

	mina?.on('accountsChanged', (accounts: string[]) => {
		toast.success(`Accounts Changed: ${accounts}`);
	});
</script>

{#if mina}
	<div>
		<button on:click={handleConnect}>connect</button>
	</div>
{:else}
	<div>
		<p>mina not available</p>
	</div>
{/if}
