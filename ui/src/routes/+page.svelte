<script lang="ts">
	import { goto } from '$app/navigation';

	import AuroConnect,{publicKey} from '$lib/components/general/AuroConnect.svelte';
	import RippleButton from '$lib/components/general/RippleButton.svelte';
</script>

<svelte:head>
	<title>Mina zkChess UI</title>
</svelte:head>

<main class="fixed inset-0 -top-1 bg-background grid place-content-center">
	<div class=" w-screen overflow-y-scroll overscroll-contain py-8">
		<div class="container flex flex-col items-center mx-auto text-center">
			<img class="h-32 mb-10 hidden md:block contrast-50 brightness-75 opacity-40 select-none" src="logo.svg" alt="" />
			<div
				class="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 mb-10 text-white"
			>
				<div class="heading text-xl md:text-2xl bg-secondary rotate-2">MINA</div>
				<div class="heading text-2xl md:text-4xl bg-primary -rotate-2">zkchess</div>
				<div class="heading text-xl md:text-2xl bg-secondary rotate-2">v0.1.5</div>
			</div>
			<h1 class="mx-10 font-bold text-2xl md:text-5xl text-balance">Secured Onchain Chess</h1>
			<p class="mx-10 mt-5 text-sm md:text-xl max-w-md whitespace-nowrap">
				✅️ Chess matches are verified <span class="font-semibold">onchain</span>.<br />
				✅️ Player ratings can be <span class=" font-semibold">trusted</span>.
			</p>
			<span class="mt-10 flex flex-col items-stretch w-[200px]">
				<AuroConnect
					let:connect
					on:connection={() => {
						goto('/game?rated=true');
					}}
				>
				{#if $publicKey}
					<RippleButton class="w-full text-xl font-bold" on:click={()=>goto('/game?rated=true')}>
						Play Now
					</RippleButton>
					{:else}
					<RippleButton class="w-full text-xl font-bold" on:click={connect}>
						Connect & Play
					</RippleButton>
					{/if}
				</AuroConnect>
				<!-- <span class="p-2 md:p-3"> or </span> -->
				<!-- <RippleButton class="w-full " on:click={() => goto('/unrated')}>Play Unrated</RippleButton> -->
			</span>
		</div>
	</div>
</main>

<style>
	.heading {
		@apply rounded-xl p-4 font-extrabold tracking-widest shadow-lg;
	}
</style>
