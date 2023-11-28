<script>
	import '../styles/globals.css';
	import { Toaster } from 'svelte-french-toast';
	import ConnectWalletButton from '$lib/ConnectWalletButton.svelte';
</script>

<Toaster containerStyle="top:50vh" />
<header>
	<nav>
		<a href="/" style="font-size:1.5rem">zkchess 0.0.1</a>
		<ConnectWalletButton />
	</nav>
</header>
<slot />

<style>
	header {
		background-color: #000;
		color: #fff;
		padding: 0.5rem;
		white-space: nowrap;
	}
	nav {
		display: flex;
		gap: 2rem;
		align-items: center;
	}
	/* separatation */
	nav > a:first-child {
		margin-right: auto;
	}
</style>
