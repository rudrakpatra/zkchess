<script lang="ts">
	import Player from './Player.svelte';
	import Board from './Board.svelte';
	import Actions from './Actions.svelte';
	import ZkChessWorkerClient from './ZkChessWorkerClient.svelte';
</script>

<div class="flex justify-center gap-1 layout">
	<div class="w-[200px] bg-background">
		<ZkChessWorkerClient />
	</div>
	<div class=" w-full max-w-[600px] aspect-square bg-background">
		<Board />
	</div>
	<div class="w-[200px] flex flex-col bg-background">
		<div>
			<Player />
		</div>
		<div class="my-auto">
			<Actions />
		</div>
		<div>
			<Player />
		</div>
	</div>
</div>

<style>
	.layout {
		grid-template-rows: 200px 600px 200px;
	}
	@media (min-width: 1024px) {
		.layout {
			grid-template-columns: 300px 600px 300px;
			grid-template-rows: 1fr;
		}
	}
</style>
