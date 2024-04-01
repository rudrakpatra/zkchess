<script>
	import '../app.pcss';
	import '../styles/globals.scss';
	import "svelte-ripple-action/ripple.css";
	import { Toaster } from 'svelte-french-toast';
	import { browser } from '$app/environment';
	import twExtend from "$lib/twExtend";
	const browserThemeColor = browser && twExtend.colors.secondary;
</script>

<svelte:head>
	<meta name="theme-color" content={browserThemeColor}/>
	<meta name="google" content="notranslate" />
</svelte:head>
<Toaster />
<slot />

<style>
</style>
