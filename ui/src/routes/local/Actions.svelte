<script>
	import ToastModal from '$lib/ToastModal.svelte';

	import toast from 'svelte-french-toast';

	export let handleDraw = async () => {
		await toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: '🤝 offering draw...',
			success: 'draw offered!',
			error: 'failed to offer draw'
		});
	};
	export let handleResign = async () => {
		await toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: '🤝 resigning...',
			success: 'resigned!',
			error: 'failed to resign'
		});
	};
	export let handleGetState = async () => {
		await toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: '🤝 getting state...',
			success: 'state received!',
			error: 'failed to get state'
		});
	};
</script>

<div class="absolute inset-1 overflow-y-scroll flex flex-col justify-start gap-1">
	<button
		class="button flex-1 whitespace-nowrap"
		on:click={() => {
			toast(ToastModal, {
				props: {
					prompt: 'opponent has offered a draw',
					options: [
						{ label: '👍 accept', action: () => toast.success('accepted draw') },
						{ label: '👎 decline', action: () => toast.error('declined draw') }
					]
				},
				duration: Infinity
			});
		}}
	>
		⭐test draw
	</button>
	<button class="button flex-1 whitespace-nowrap" on:click={handleDraw}> 🤝 offer draw </button>
	<button class="button flex-1 whitespace-nowrap" on:click={handleResign}> 😖 resign </button>
	<button class="button flex-1 whitespace-nowrap" on:click={handleGetState}> 📜 get state </button>
</div>
