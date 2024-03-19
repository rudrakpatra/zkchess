<script lang="ts">
	import { Chess,type Move ,SQUARES} from 'chess.js';
	import "$lib/chessground/chessground.base.css";
    import "$lib/chessground/chessground.brown.css";
    import "$lib/chessground/chessground.cburnett.css";    
	import { Chessground } from 'chessground'
	import type { Api as ChessgroundAPI} from 'chessground/api';

	export let startingFen:string;
	export let chessgroundAPI : ChessgroundAPI;
	
	let chessJS=new Chess();
	const possibleMovesDests=()=>{
		chessJS.load(startingFen);
		const dests = new Map();
		SQUARES.forEach(s => {
			const ms = chessJS.moves({square: s, verbose: true});
			if (ms.length) dests.set(s, ms.map(m => m.to));
		});
		return dests;
	}

	const chessgroundHook=(el:HTMLDivElement)=>chessgroundAPI= Chessground(el);

	$:chessgroundAPI && chessgroundAPI.set({
		movable: {
			free:true,
			dests: possibleMovesDests(),
			color: 'both',
			events: {
				after: (orig, dest) => {
					console.log(orig, dest);
					const move = chessJS.move({from: orig, to: dest, promotion: 'q'});
					if (move === null) return 'snapback';
					console.log(chessJS.fen());
				}
			}
		}
	});
</script>

<div class="absolute w-full h-full" use:chessgroundHook/>