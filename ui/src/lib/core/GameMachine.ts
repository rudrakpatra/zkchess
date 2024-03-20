// import { verify } from 'o1js';
import type { DataConnection } from 'peerjs';
import{  get, writable, type Unsubscriber, type Writable } from 'svelte/store';
import { GameObject, GameResult, GameState, Move, type PromotionRankAsChar,} from 'zkchess-interactive';

class Sync<T>{
	private list:Writable<T[]>=writable([]);
	public subscribe=(fn:(value:T[])=>void)=>this.list.subscribe(fn);
	public unsubscriber:Unsubscriber;
	public push(value:T){
		this.list.update(list=>[...list,value]);
	}
	public consume(){
		const pop=()=>{
			const item=get(this.list)[0];
			// console.warn("Consumed",item);
			this.unsubscriber && this.unsubscriber();
			this.list.update(moves=>moves.slice(1));
			return item;
		}
		// console.log("Consuming",get(this.list),get(this.list).length);
		if(get(this.list).length>0) return pop();
		return new Promise<T>(res=>{
			if(get(this.list).length>0) res(pop());
			else this.unsubscriber=this.list.subscribe(list=>list.length>0&&res(pop()));
		});
	}
}

class GameLoop {
	local:Sync<GameState>=new Sync();
	network:Sync<GameState>=new Sync();
	gameState: Writable<GameState>;
	constructor(fen: string) {
		this.gameState = writable(GameState.fromFEN(fen));
	}
	public attachPeer(conn:DataConnection){
		conn.removeAllListeners();
		conn.on('data', (msg) =>{console.log("recv:",msg);this.network.push(GameState.fromFEN(msg as string))});
	}
	public placeMove(from: string, to: string, promotion?: PromotionRankAsChar) {
		this.local.push(new GameObject(get(this.gameState)).toUpdated(Move.fromLAN(from, to, (promotion||'q') as PromotionRankAsChar)));
	}
	public verify(){
		// console.log("%cChecking game result",'color:blue;');
		const result=Number(get(this.gameState).result.toBigInt());
		if ([GameResult.WHITE_WINS,GameResult.BLACK_WINS, GameResult.DRAW,GameResult.DRAW_BY_STALEMATE].includes(result))
		return;
	}
	public async playAsWhite(conn:DataConnection) {
		// console.log("Playing as white")
		for (let i = 0; i < 10; i++) {
			const gs=await this.local.consume();
			this.verify();
			console.log(`%c${gs.toAscii()}`,'color:blue;');
			conn.send(gs.toFEN());
			const gs1=await this.network.consume();
			this.verify();
			this.gameState.set(gs1);
			console.log(`%c${gs1.toAscii()}`,'color:green;');
		}
		// const gs1=await this.local.consume();
		// this.gameState.set(gs1);
		// this.verify();
		// console.log(`%c${gs1.toAscii()}`,'color:green;');
		// conn.send(gs1.toFEN());
		// const gs2=await this.network.consume();
		// this.verify();
		// this.gameState.set(gs2);
		// console.log("GAME ENDED AS " ,gs2.toFEN());
	}
	public async playAsBlack(conn:DataConnection) {
		// console.log("Playing as black")
		for(let i=0;i<10;i++){
			const gs=await this.network.consume();
			this.verify();
			this.gameState.set(gs);
			console.log(`%c${gs.toAscii()}`,'color:green;');
			const gs1=await this.local.consume();
			this.verify();
			console.log(`%c${gs1.toAscii()}`,'color:blue;');
			conn.send(gs1.toFEN());
		}
		// const gs1=await this.network.consume();
		// this.verify();
		// this.gameState.set(gs1);
		// const gs2=await this.local.consume();
		// console.log(`%c${gs2.toAscii()}`,'color:green;');
		// conn.send(gs2.toFEN());
		// this.verify();
		// this.gameState.set(gs2);
		// console.log("GAME ENDED AS " ,gs2.toFEN());
		// const result=Number(get(this.gameState).result.toBigInt());
		// switch(result){
		// 	case GameResult.ONGOING:
		// 		console.log("Ongoing");	
		// 		break;

		// 	case GameResult.ONGOING_OFFERED_DRAW:
		// 		console.log("Ongoing offered draw");
		// 		break;

		// 	case GameResult.ONGOING_AND_STALEMATE_CLAIMED:
		// 		console.log("Ongoing and stalemate claimed");
		// 		break;

		// 	case GameResult.STALEMATE_CLAIM_REPORTED:
		// 		console.log("Stalemate claim reported");
		// 		break;

		// 	case GameResult.WHITE_WINS:
		// 		console.log("White wins");
		// 		break;

		// 	case GameResult.BLACK_WINS:
		// 		console.log("Black wins");
		// 		break;

		// 	case GameResult.DRAW:
		// 		console.log("Draw");
		// 		break;

		// 	case GameResult.DRAW_BY_STALEMATE:
		// 		console.log("Draw by stalemate");
		// 		break;
		// }
	}
}
//gs0  gs0
//gs1->gs1
//gs2<-gs2
//gs3->gs3
export default GameLoop;