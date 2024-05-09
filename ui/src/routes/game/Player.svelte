<script lang="ts">
	import RippleButton from '$lib/components/general/RippleButton.svelte';
	import ellipsis from '$lib/ellipsis';
	import { Icon } from 'svelte-icons-pack';
	import { TrOutlineExternalLink } from 'svelte-icons-pack/tr';
	export let publicKeybase58 :string;
	export let rating: number;
	export let link= publicKeybase58? "/player?key="+publicKeybase58: null;
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
		class="text-lg font-medium flex-1 min-w-0 self-center px-4 whitespace-nowrap"
		title={publicKeybase58|| 'no public key found'}
	>
		<span class="long text-center overflow-hidden text-ellipsis"> {publicKeybase58 || "-"} </span>
		<span class="short text-center overflow-hidden text-ellipsis">
			{ellipsis(publicKeybase58 || "-", 12)}
		</span>
	</span>
	<a tabindex="-1" class:disabled-link={!link} href={link} title={'view player profile'}>
		<RippleButton tabindex={-1} class="
			bg-secondary text-chess-200
			text-sm font-bold
			grid place-items-center
			px-1 min-w-[40px] h-full
			">
			<Icon src={TrOutlineExternalLink} size={20} />
		</RippleButton>
	</a>
</div>

<style lang="scss">
	.disabled-link{
		pointer-events: none;
		filter:contrast(.8);
	}
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
