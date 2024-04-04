<script lang="ts">
	import ellipsis from '$lib/ellipsis';
	import { Icon } from 'svelte-icons-pack';
	import { TrOutlineExternalLink } from 'svelte-icons-pack/tr';
	export let username = 'Not found';
	export let rating: number;
	export let link: string;
</script>

<div id="player" class="absolute inset-1 layout">
	<span
		class=" rounded-md
		bg-secondary text-chess-200
		text-sm font-bold
		grid place-items-center
		px-1 min-w-[40px]
		"
		title={Number.isFinite(rating)
			? `this player has a rating of ${rating}%`
			: "this player's rating is not available"}
	>
		{Number.isFinite(rating) ? rating : '?'}
	</span>
	<span
		class="text-lg font-medium flex-1 min-w-0 self-center px-4 whitespace-nowrap
	
	
	
	
	"
	>
		<span class="long text-center overflow-hidden text-ellipsis"> {username} </span>
		<span class="short overflow-hidden text-ellipsis" title={username}>
			{ellipsis(username, 12)}
		</span>
	</span>
	<a
		class=" rounded-md
		bg-secondary text-chess-200
		text-sm font-bold
		grid place-items-center
		px-1 min-w-[40px]
		"
		href={link}
		title={'view player profile'}
	>
		<Icon src={TrOutlineExternalLink} size={20} />
	</a>
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
