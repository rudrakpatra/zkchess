<script>
	import ToastModal from '$lib/ToastModal.svelte';
	import { animationOnFocus } from '$lib/actions/interaction';
	import toast from 'svelte-french-toast';

	export let handleDraw = () => {
		console.warn('handleDraw not implemented');
	};
	export let handleResign = () => {
		console.warn('handleResign not implemented');
	};
</script>

<button
	class="button"
	use:animationOnFocus
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
<button
	class="button"
	use:animationOnFocus
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
	use:animationOnFocus
	on:click={() =>
		toast.promise(new Promise((r) => setTimeout(r, 3000)), {
			loading: '🤝 resigning...',
			success: 'resigned!',
			error: 'failed to resign'
		})}
>
	😖 resign
</button>
