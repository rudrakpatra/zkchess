<script lang="ts">
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>

<main>
	<div class="py-24 bg-[#f6f4fa] border-b-4">
		<div class="container max-w-xl flex flex-col items-center mx-auto text-center">
			<img class="h-16 mb-10" src="favicon.png" alt="" />
			<div
				class="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 mb-10 text-white"
			>
				<div
					class="p-4 text-xl md:text-2xl font-extrabold bg-[#322f35] uppercase tracking-widest rounded-xl -rotate-2 shadow-lg"
				>
					MINA
				</div>
				<div
					class="p-4 text-2xl md:text-4xl font-extrabold bg-[#6819fd] uppercase tracking-widest rounded-xl rotate-3 shadow-lg"
				>
					zkchess
				</div>
				<div
					class="p-4 text-xl md:text-2xl font-extrabold bg-[#322f35] uppercase tracking-widest rounded-xl -rotate-2 shadow-lg"
				>
					v0.1.0
				</div>
			</div>
			<h1 class="font-bold text-3xl md:text-5xl text-balance">A Fully Secured Onchain Chess</h1>
			<p class="mt-10 text-lg md:text-xl max-w-md text-balance">
				Chess matches are verified <span class="font-semibold">onchain</span> and player ratings can
				be
				<span class=" font-semibold">trusted</span>.
			</p>
		</div>
	</div>
</main>

<style>
</style>
