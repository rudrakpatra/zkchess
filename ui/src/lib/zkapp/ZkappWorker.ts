import * as Comlink from 'comlink';
import { dummyBase64Proof, type JsonProof } from 'o1js/dist/node/lib/proof-system';
import { Pickles } from 'o1js/dist/node/snarky';
import { PublicKey,PrivateKey,Signature} from 'o1js';
import {GameState,GameObject, PvPChessProgram, PvPChessProgramProof, RollupState, type PromotionRankAsChar, Move} from "zkchess-interactive";

let dummy:unknown;

let time;
const proofsEnabled = false;
let initialRollupState:RollupState;

export type Player={
	publicKey:string,
	signedJSONForStartingGame:Signature,
}

async function start(white:Player, black:Player, fen?: string) {
	let jsonProof:JsonProof;
	if(proofsEnabled){
		console.log('worker | generating real start');
		initialRollupState=RollupState.from(
			GameState.fromFEN(fen),
			PublicKey.fromBase58(white.publicKey),
			PublicKey.fromBase58(black.publicKey)
		);
		console.time('start');
		jsonProof=(await PvPChessProgram.start(
			initialRollupState,
			Signature.fromJSON(white.signedJSONForStartingGame),
			Signature.fromJSON(black.signedJSONForStartingGame)
		)).toJSON();
		console.timeEnd('start');
	}
	else{
		console.log('worker | generating dummy start');
		jsonProof= new PvPChessProgramProof({
			proof: dummy,
			publicInput: RollupState.from(GameState.fromFEN(fen), PublicKey.fromBase58(white.publicKey), PublicKey.fromBase58(black.publicKey)),
			publicOutput: GameState.fromFEN(fen),
			maxProofsVerified: 2
		}).toJSON();
	}
	return jsonProof;
}

async function move(from: string, to: string, promotion:PromotionRankAsChar,lastProofJSON:JsonProof,privateKey:string) {
	let jsonProof:JsonProof;
	if(proofsEnabled){
		console.log('worker | generating real move');
		console.time('start');
		jsonProof=(await PvPChessProgram.move(
		initialRollupState,
		PvPChessProgramProof.fromJSON(lastProofJSON),
		Move.fromLAN(from, to, promotion || 'q'),
		PrivateKey.fromBase58(privateKey)
		)).toJSON();
		console.timeEnd('start');
	}
	else{
		console.log('worker | generating dummy move');
		const lastProof=PvPChessProgramProof.fromJSON(lastProofJSON);
		const newGameState=new GameObject(lastProof.publicOutput).toUpdated(Move.fromLAN(from, to, promotion || 'q'));
		jsonProof= new PvPChessProgramProof({
			proof: dummy,
			publicInput: initialRollupState,
			publicOutput: newGameState,
			maxProofsVerified: 2
		}).toJSON();
	}
	return jsonProof;
}

// async function offerDraw(lastProofJSON:string,privateKey:string) {
// 	if(proofsEnabled){
// 		console.log('worker | generating real offerDraw');

// 		console.time('start');
// 		const proof= await PvPChessProgram.offerDraw(
// 		initialRollupState,
// 		Signature.fromJSON(white.signedJSONForStartingGame),
// 		Signature.fromJSON(black.signedJSONForStartingGame)
// 		);
// 		console.timeEnd('start');
// 		return proof0;
// 	}
// 	else{
// 		console.log('worker | generating dummy offerDraw');
// 		const gameObject=GameObject.from()
// 		return new PvPChessProgramProof({
// 			proof: dummy,
// 			publicInput: RollupState.from(GameState.fromFEN(fen), PublicKey.fromBase58(white.publicKey), PublicKey.fromBase58(black.publicKey)),
// 			publicOutput: new GameObject(),
// 			maxProofsVerified: 2
// 		}).toJSON();
// 	}
// }
// 			move: async (from: string, to: string, promotion:PromotionRankAsChar) => {
// 				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
// 					zkapp.move(Move.fromLAN(from, to, promotion || 'q'));
// 				});
// 				await txn.prove();
// 				await txn.sign([whitePlayer.privateKey]).send();
// 			},
// 			offerDraw: async () => {
// 				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
// 					zkapp.offerDraw();
// 				});
// 				await txn.prove();
// 				await txn.sign([whitePlayer.privateKey]).send();
// 			},
// 			acceptDraw: async () => {
// 				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
// 					zkapp.resolveDraw(Bool(true));
// 				});
// 				await txn.prove();
// 				await txn.sign([whitePlayer.privateKey]).send();
// 			},
// 			rejectDraw: async () => {
// 				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
// 					zkapp.resolveDraw(Bool(false));
// 				});
// 				await txn.prove();
// 				await txn.sign([whitePlayer.privateKey]).send();
// 			},
// 			resign: async () => {
// 				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
// 					zkapp.resign();
// 				});
// 				await txn.prove();
// 				await txn.sign([whitePlayer.privateKey]).send();
// 			},
// 			getFEN: async () => {
// 				return zkapp.getGameState().toFEN();
// 			},
// 			getPlayerRating: async (publicKey: string) => {
// 				return Number(zkapp.getPlayerRating(PublicKey.fromBase58(publicKey)).toBigInt());
// 			}
// 	}
// }


if (proofsEnabled) {
	console.time('compiling PvPChessProgram');
	time = Date.now();
	await PvPChessProgram.compile();
	console.timeEnd('compiling PvPChessProgram');
} else {
	// bigint are serialized as strings with 'n' suffix
	dummy = Pickles.proofOfBase64(await dummyBase64Proof(), 2)[1];
}

const api={
	start,
	move,
	// offerDraw,
	// acceptDraw,
	// rejectDraw,
	// resign,
	// getFEN,
	// getPlayerRating
	ready: true
}
export type API = typeof api;
Comlink.expose(api);
self.postMessage('ready');
