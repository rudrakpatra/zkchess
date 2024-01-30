<script lang="ts">
	import { goto } from '$app/navigation';

	import AuroConnect from '$lib/components/general/AuroConnect.svelte';
	import ellipsis from '$lib/ellipsis';
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>

<main class="bg-background h-screen grid place-content-center">
	<div class="container max-w-xl flex flex-col items-center mx-auto text-center">
		<img class="h-32 mb-10 opacity-20" src="king.png" alt="" />
		<div
			class="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 mb-10 text-white"
		>
			<div class="heading text-xl md:text-2xl bg-secondary rotate-2">MINA</div>
			<div class="heading text-2xl md:text-4xl bg-primary -rotate-2">zkchess</div>
			<div class="heading text-xl md:text-2xl bg-secondary rotate-2">v0.1.0</div>
		</div>
		<h1 class="mx-10 font-bold text-3xl md:text-5xl text-balance">Secured Onchain Chess</h1>
		<p class="mx-10 mt-5 text-lg md:text-xl max-w-md">
			✅️ Chess matches are verified <span class="font-semibold">onchain</span>.<br />
			✅️ Player ratings can be <span class=" font-semibold">trusted</span>.
		</p>
		<span class="mt-10">
			<AuroConnect
				let:connect
				on:connection={() => {
					goto('/game');
				}}
			>
				<button class="button p-3" on:click={connect}> Connect And Play </button>
			</AuroConnect>
		</span>
	</div>
</main>

<style>
	.heading {
		@apply rounded-xl p-4 font-extrabold tracking-widest shadow-lg;
	}
</style>
