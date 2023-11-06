<script lang="ts">
	import Chess from './Chess.svelte';
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>
<main>
	<section class="flex-container">
		<Chess />
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		height: 100vh;
	}
	.flex-container {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 0.5rem;
		justify-content: center;
	}
</style>
