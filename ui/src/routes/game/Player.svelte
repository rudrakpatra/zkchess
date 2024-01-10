<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	export let username = '23bdxdge252143214442b4ds1bs2bsdg44s2';
	export let rating = '500';
</script>

<div class="m-1">
	<span class="text-lg">{ellipsis(username, 14)}</span>
	<span class="text-xl font-medium">({rating})</span>
</div>

<style>
</style>
