<script lang="ts">
	import type { Move } from 'chess.js';
	import "$lib/chessground/chessground.base.css";
    import "$lib/chessground/chessground.brown.css";
    import "$lib/chessground/chessground.cburnett.css";    
	import { Chessground } from 'chessground'
	import type { Api as ChessgroundAPI} from 'chessground/api';

	export let readonly = false;
	// export let move = (move: Move) => {
	// 	console.warn('handleMove not implemented');
	// };
	// export let loadFEN = (fen: string) => {
	// 	console.warn('loadFen not implemented');
	// };

	let chessgroundAPI : ChessgroundAPI;
	const chessgroundHook=(el:HTMLDivElement)=>{
		chessgroundAPI= Chessground(el);
	};
</script>

<div class:readonly class="absolute w-full h-full" use:chessgroundHook/>


<style>
	.readonly {
		opacity: 0.5;
		pointer-events: none;
	}
</style>
