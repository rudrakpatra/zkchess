<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	export let username = '23bdxdge252143214442b4ds1bs2bsdg44s2';
	export let rating = '500';
</script>

<div id="player" class="absolute inset-1 layout">
	<span
		class=" 
	rounded-md
		bg-secondary text-chess-200
		text-sm font-bold
		grid place-items-center
		p-1 min-w-[40px]
		"
	>
		{rating}
	</span>
	<span class="text-lg font-medium flex-1 min-w-0 self-center">
		<span class="long text-center overflow-hidden text-ellipsis"> {username} </span>
		<span class="short overflow-hidden text-ellipsis" title={username}>
			{ellipsis(username, 12)}
		</span>
	</span>
</div>

<style lang="scss">
	#player {
		container-type: inline-size;
		.long {
			display: block;
		}
		.short {
			display: none;
		}
	}

	@container (max-width: 190px) {
		#player {
			.long {
				display: none;
			}
			.short {
				display: block;
			}
		}
	}
	.layout {
		@apply flex gap-1;
	}
</style>
