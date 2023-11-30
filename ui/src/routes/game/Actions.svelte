<script>
	import ToastModal from '$lib/ToastModal.svelte';
	import { click } from '$lib/actions/interaction';
	import toast from 'svelte-french-toast';
</script>

<button
	class="button"
	use:click
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
	⭐test
</button>
<button
	class="button"
	use:click
	on:click={() =>
		toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: '🤝 offering draw...',
			success: 'draw offered!',
			error: 'failed to offer draw'
		})}
>
	🤝 offer draw
</button>
<button
	class="button"
	use:click
	on:click={() =>
		toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: '🤝 resigning...',
			success: 'resigned!',
			error: 'failed to resign'
		})}
>
	😖 resign
</button>
