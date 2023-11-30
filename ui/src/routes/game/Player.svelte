<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	export let username = 'dragonlord214214442412442';
	export let rating = '500';
</script>

<img class="m-1 bg-secondary w-10 aspect-square" src="./favicon.png" alt="chess board" />
<div class="m-1">
	<span class="text-lg">{ellipsis(username, 14)}</span>
	<span class="text-xl font-medium">({rating})</span>
</div>

<style>
</style>
