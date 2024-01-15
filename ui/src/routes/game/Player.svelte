<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	export let username = '23bdxdge252143214442b4ds1bs2bsdg44s2';
	export let rating = '500';
</script>

<div class="absolute inset-1 layout">
	<img class="rounded-sm" src="./king.jpeg" />
	<span class="text-lg flex-1 min-w-0 overflow-hidden self-center" title={username}
		>{ellipsis(username, 10)}</span
	>
	<span class="text-xl font-medium self-center">({rating})</span>
</div>

<style>
	.layout {
		@apply flex gap-2;
	}
</style>
