<script lang="ts">
	// import type { Move } from 'chess.js';
	import "$lib/chessground/chessground.base.css";
    import "$lib/chessground/chessground.brown.css";
    import "$lib/chessground/chessground.cburnett.css";    
	import { Chessground } from 'chessground'
	import type { Api as ChessgroundAPI} from 'chessground/api';

	export let ready=false;
	export let chessgroundAPI : ChessgroundAPI;
	const chessgroundHook=(el:HTMLDivElement)=>{
		chessgroundAPI= Chessground(el);
		ready=true;
	};
</script>

<div class="absolute w-full h-full" use:chessgroundHook/>