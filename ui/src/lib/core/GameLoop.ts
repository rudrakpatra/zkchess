// import { verify } from 'o1js';
import{  get, writable, type Writable } from 'svelte/store';
import { GameResult, GameState, Move } from 'zkchess-interactive';
import { GameEvent, GameObject } from 'zkchess-interactive/build/src/GameLogic/GameLogic';
// import { PvPChessProgramProof, PvPChessProgram, GameResult } from 'zkchess-interactive';

export type DUMMYPROOFTYPE = {};
export const DUMMYPROOF={};
export const verify=()=>{};

export type Agent = {
	turn:Writable<boolean>;
	move:Writable<Move|null>;
	awaitNextGameStateProof: (...args:any) => Promise<DUMMYPROOFTYPE>;
};

class GameLoop {
	gameState: Writable<GameState>;
	constructor(fen: string) {
		this.gameState = writable(GameState.fromFEN(fen));
	}
	public async start(white: Agent, black: Agent, fen: string) {
		this.gameState.set(GameState.fromFEN(fen));
		while(true){
			const currState = get(this.gameState);
			const turn = currState.turn.toBoolean();
			const agent = turn ? white : black;
			const result=Number(currState.result.toString());

			agent.turn.set(true);
			console.log("Waiting for move");
			await agent.awaitNextGameStateProof();
			const move = get(agent.move)!;
			switch(result){
				case GameResult.ONGOING:
					console.log("Ongoing");	
					this.gameState.set(new GameObject(currState).toUpdated(move));
					break;

				case GameResult.ONGOING_OFFERED_DRAW:
					console.log("Ongoing offered draw");
					break;
				case GameResult.ONGOING_AND_STALEMATE_CLAIMED:
					console.log("Ongoing and stalemate claimed");
					break;
				case GameResult.STALEMATE_CLAIM_REPORTED:
					console.log("Stalemate claim reported");
					break;
				case GameResult.WHITE_WINS:
					console.log("White wins");
					break;

				case GameResult.BLACK_WINS:
					console.log("Black wins");
					break;

				case GameResult.DRAW:
					console.log("Draw");
					break;

				case GameResult.DRAW_BY_STALEMATE:
					console.log("Draw by stalemate");
					break;
			}
		}
		
	}
}

export default GameLoop;
