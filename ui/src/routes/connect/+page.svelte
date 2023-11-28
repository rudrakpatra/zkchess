<script lang="ts">
	import Frame from '$lib/Frame.svelte';
	import button from '$lib/actions/button';
	import ellipsis from '$lib/ellipsis';
	import { onMount } from 'svelte';
	import toast from 'svelte-french-toast';

	let mina: any;

	const connect = async () => {
		await toast.promise<Array<string>>(
			mina.requestAccounts(),
			{
				loading: 'Connecting...',
				success: (account) => `Received account ${ellipsis(account[0], 20)}`,
				error: (error) => error.message
			},
			{ duration: 3000 }
		);
	};

	onMount(() => {
		mina = (window as any)?.mina;
		mina && toast.success(`Mina is Available!`, { icon: '🎉' });
	});
</script>

<Frame id="connect">
	<button
		use:button
		class="p-2 m-2 text-white bg-[#6819fd] rounded-lg shadow-lg"
		on:click={connect}
	>
		Connect
	</button>
</Frame>
