<script>
	import '../app.pcss';
	import '../styles/globals.css';
	import { Toaster } from 'svelte-french-toast';
</script>

<Toaster />
<slot />
<footer class="absolute bottom-0 w-full">
	<p class="mx-auto text-center text-lg md:text-xl max-w-md text-balance">
		Check out the source code on
		<a href="https://github.com/rudrakpatra/zkchess" class="font-medium text-[#6819fd]">Github</a>.
	</p>
</footer>

<style>
</style>
