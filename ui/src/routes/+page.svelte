<script lang="ts">
	import { click } from '$lib/actions/interaction';
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>

<main>
	<div class="py-24 bg-background border-b-4">
		<div class="container max-w-xl flex flex-col items-center mx-auto text-center">
			<img class="h-16 mb-10" src="favicon.png" alt="" />
			<div
				class="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 mb-10 text-white"
			>
				<div
					class="p-4 text-xl md:text-2xl font-extrabold bg-secondary uppercase tracking-widest rounded-xl rotate-2 shadow-lg"
				>
					MINA
				</div>
				<div
					class="p-4 text-2xl md:text-4xl font-extrabold bg-primary uppercase tracking-widest rounded-xl -rotate-3 shadow-lg"
				>
					zkchess
				</div>
				<div
					class="p-4 text-xl md:text-2xl font-extrabold bg-secondary uppercase tracking-widest rounded-xl rotate-2 shadow-lg"
				>
					v0.1.0
				</div>
			</div>
			<h1 class="mx-10 font-bold text-3xl md:text-5xl text-balance">Secured Onchain Chess</h1>
			<p class="mx-10 mt-5 text-lg md:text-xl max-w-md text-balance">
				Chess matches are verified <span class="font-semibold">onchain</span>
				and player ratings can be <span class=" font-semibold">trusted</span>.
			</p>
			<span class="mt-10">
				<a use:click class="button p-3" href="/game"> Connect and Play </a>
			</span>
		</div>
	</div>
</main>

<style>
</style>
