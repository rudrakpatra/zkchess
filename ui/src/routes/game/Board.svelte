<script lang="ts">
	import { Chess,type Move ,SQUARES} from 'chess.js';
	import "$lib/chessground/chessground.base.css";
    import "$lib/chessground/chessground.brown.css";
    import "$lib/chessground/chessground.cburnett.css";    
	import { Chessground } from 'chessground'
	import { createEventDispatcher } from 'svelte';
	import type { Api as ChessgroundAPI} from 'chessground/api';

	export let fen:string;
	export let chessgroundAPI : ChessgroundAPI;
	export let playAsBlack:boolean;
	export let gameStarted:boolean;
	let chessJS=new Chess();

	// $: console.log(`%c${fen}`,'color:pink;');
	$:if(chessgroundAPI && gameStarted){
		chessJS.load(fen);
		// console.log("it's now turn of "+chessJS.turn());
		chessgroundAPI.set({
			turnColor:chessJS.turn()==='w'?'white':'black',
			fen: chessJS.fen(),
			movable: {
				free:false,
				dests: SQUARES.reduce((dests,sqr,i)=>{
					const ms = chessJS.moves({square: sqr, verbose: true});
					return  ms.length ?dests.set(sqr, ms.map(m => m.to)):dests;
				},new Map())
			}
		});
	};
	const chessgroundHook=(el:HTMLDivElement)=>{
		chessgroundAPI=Chessground(el,{
			premovable:{
					enabled:false,
				},
			movable:{
				free:false,
				dests:new Map(),
				color:playAsBlack?'black':'white',
				events: {
					after: (orig, dest) => {
						const move = chessJS.move({from: orig, to: dest, promotion: 'q'});
						if (move === null) return 'snapback';
						dispatch('move',move);
					}
				}
			}
		})
	};
	const dispatch=createEventDispatcher();
</script>

<div class="absolute w-full h-full" use:chessgroundHook/>