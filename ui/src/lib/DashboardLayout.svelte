<!-- dashboard layout -->
<main>
	<div class="layout">
		<div id="playerA" style="grid-area:playerA">
			<slot name="playerA">player A</slot>
		</div>
		<div id="playerB" style="grid-area:playerB">
			<slot name="playerB">player B</slot>
		</div>
		<div id="board" style="grid-area:board;">
			<slot name="board">board</slot>
		</div>
		<div id="logs" style="grid-area:logs">
			<slot name="logs">logs</slot>
		</div>
		<div id="actions" style="grid-area:actions">
			<slot name="actions">actions</slot>
		</div>
		<span id="fab" class="hidden">
			<slot name="fab">fab</slot>
		</span>
	</div>
</main>

<style lang="scss">
	main {
		@apply bg-background fixed inset-0  grid justify-center overflow-y-scroll p-2;
		@apply -top-1 pt-3; //prevent browser address bar from sliding up
		container-type: inline-size;
	}
	// desktop view
	.layout {
		@apply grid place-content-center gap-2;
		grid-template: 3rem 23rem 6.5rem 3rem / 12rem 30rem;
		grid-template-areas:
			'logs playerB '
			'logs board '
			'actions board'
			'actions playerA ';
		div {
			@apply shadow-chess-600/20 shadow-lg;
			@apply h-full w-full rounded-md;
			@apply bg-chess-400;
		}
		#fab{
			@apply z-50;
			@apply fixed w-fit h-fit bottom-2 right-2;
			@apply p-2;
			@apply rounded-full;	
		}
	}
	// landscape-view
	@media (max-height: 38rem) {
		.layout {
			grid-template: 3rem 10rem 7.5rem 3rem / 12rem 25rem;
			grid-template-areas:
				'playerB board'
				'logs board'
				'actions board'
				'playerA board';
			// div {
			// 	@apply bg-gray-800;
			// }
		}
	}
	// mobile view
	@media (max-width: 44rem) {
		main{
			@apply overflow-x-hidden;
			scroll-snap-type: mandatory;
		}
		.layout {
			place-content: start;
			grid-template: 3rem 100cqw 3rem 9.5rem 1fr/ 100cqw;
			grid-template-areas:
			'playerB'
			'board'
			'playerA'
			'actions'
			'logs';
			// div {
			// 	@apply bg-red-400;
			// }
			#logs{				
				height: calc(100cqh - 1rem);
			}
		}
	}
</style>
