<script lang="ts">
	import Chess from './Chess.svelte';
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>

<main>
	<Chess />
</main>

<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		background-color: #423c34;
	}
</style>
