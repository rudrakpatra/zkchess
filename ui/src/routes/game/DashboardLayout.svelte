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
		grid-template: 3rem 30rem 10rem 3rem/ 20rem 40rem;
		grid-template-areas:
			'logs playerB '
			'logs board '
			'actions board'
			'actions playerA ';
		div {
			// @apply grid place-items-center;
			@apply h-full w-full rounded-md p-1 shadow-lg;
			@apply bg-chess-400;
		}
		#actions,
		#logs {
			@apply overflow-auto;
		}
	}
	@media (max-width: 85rem) or (max-height: 50rem) {
		.layout {
			grid-template: 3rem 30rem 5rem 3rem / 20rem 35rem;
			grid-template-areas:
				'logs playerB'
				'logs board'
				'actions board'
				'actions playerA';
			div {
				// @apply bg-blue-500;
			}
		}
	}
	@media (max-width: 60rem) or (max-height: 45rem) {
		.layout {
			grid-template: 3rem 20rem 7rem 3rem / 12rem 27rem;
			grid-template-areas:
				'logs playerB'
				'logs board'
				'actions board'
				'actions playerA';
			div {
				// @apply bg-gray-500;
			}
		}
	}

	@media (max-height: 35rem) {
		.layout {
			grid-template: 3rem 15rem 7rem 3rem / 12rem 22rem;
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
	@media (max-width: 40rem) {
		.layout {
			--container-width: 100cqw;
			grid-template: 3rem var(--container-width) 3rem 5rem 10rem / var(--container-width);
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
