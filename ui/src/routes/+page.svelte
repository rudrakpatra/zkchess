<script lang="ts">
	import Chess from './Chess.svelte';
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>
<main class="flex-container">
	<Chess />
</main>

<style>
	.flex-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.5rem;
		justify-content: center;
	}
</style>
