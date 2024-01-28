<!-- dashboard layout -->
<main>
	<div class="layout">
		<div id="logs" style="grid-area:logs">
			<slot name="logs">logs</slot>
		</div>
		<div id="board" style="grid-area:board;">
			<slot name="board">board</slot>
		</div>
		<div id="playerA" style="grid-area:playerA">
			<slot name="playerA">player A</slot>
		</div>
		<div id="actions" style="grid-area:actions">
			<slot name="actions">actions</slot>
		</div>
		<div id="playerB" style="grid-area:playerB">
			<slot name="playerB">player B</slot>
		</div>
	</div>
</main>

<style lang="scss">
	main {
		@apply bg-background fixed inset-0 grid justify-center overflow-y-scroll p-2;
		container-type: inline-size;
	}
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
	}

	@media (max-height: 38rem) {
		.layout {
			grid-template: 3rem 10rem 7.5rem 3rem / 12rem 25rem;
			grid-template-areas:
				'playerB board'
				'logs board'
				'actions board'
				'playerA board';
			div {
				// @apply bg-gray-800;
			}
		}
	}
	@media (max-width: 44rem) {
		.layout {
			--container-width: 100cqw;
			grid-template: 3rem var(--container-width) 3rem 9.5rem 10rem / var(--container-width);
			grid-template-areas:
				'playerB'
				'board'
				'playerA'
				'actions'
				'logs';
			div {
				// @apply bg-red-400;
			}
		}
	}
</style>
