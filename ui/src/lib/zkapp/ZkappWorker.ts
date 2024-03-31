import * as Comlink from 'comlink';
import { PublicKey, PrivateKey, Signature, Bool, Field, type JsonProof } from 'o1js';
import {
	GameState,
	GameObject,
	PvPChessProgram,
	PvPChessProgramProof,
	RollupState,
	type PromotionRankAsChar,
	Move
} from 'zkchess-interactive';

const proofsEnabled = false;


let verificationKey:{
    data: string;
    hash: Field;
};
let initialRollupState: RollupState;

export type PlayerSignature = {
	publicKey: string;
	jsonSignature: string;
};

async function start(white: PlayerSignature, black: PlayerSignature, fen?: string) {
	let jsonProof: JsonProof;
	initialRollupState = RollupState.from(
		GameState.fromFEN(fen),
		PublicKey.fromBase58(white.publicKey),
		PublicKey.fromBase58(black.publicKey)
	);
	if (proofsEnabled) {
		console.log('worker | generating real start');
		console.time('start');
		jsonProof = (
			await PvPChessProgram.start(
				initialRollupState,
				Signature.fromJSON(white.jsonSignature),
				Signature.fromJSON(black.jsonSignature)
			)
		).toJSON();
		console.timeEnd('start');
	} else {
		console.log('worker | generating dummy start');
		const proof= await PvPChessProgramProof.dummy(initialRollupState,GameState.fromFEN(fen),2)
		jsonProof=proof.toJSON();
	}
	return jsonProof;
}

async function move(
	from: string,
	to: string,
	promotion: PromotionRankAsChar,
	lastProofJSON: JsonProof,
	privateKey: string
) {
	let jsonProof: JsonProof;
	const move=Move.fromLAN(from, to, promotion || 'q');
	if (proofsEnabled) {
		console.log('worker | generating real move');
		console.time('start');
		jsonProof = (
			await PvPChessProgram.move(
				initialRollupState,
				PvPChessProgramProof.fromJSON(lastProofJSON),
				move,
				PrivateKey.fromBase58(privateKey)
			)
		).toJSON();
		console.timeEnd('start');
	} else {
		console.log('worker | generating dummy move');
		const lastProof = PvPChessProgramProof.fromJSON(lastProofJSON);
		const newGameState = new GameObject(lastProof.publicOutput).toUpdated(move);
		const proof= await PvPChessProgramProof.dummy(initialRollupState,newGameState,2);
		jsonProof=proof.toJSON();
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
	console.log('compiling PvPChessProgram');
	console.time('compiling PvPChessProgram');
	verificationKey=(await PvPChessProgram.compile()).verificationKey;
	console.timeEnd('compiling PvPChessProgram');
} else {
	verificationKey={data: '', hash: Field.from(0)};
	console.log('using PvPChessProgramDummy');
}

const api = {
	start,
	move,
	// offerDraw,
	// acceptDraw,
	// rejectDraw,
	// resign,
	// getFEN,
	// getPlayerRating
	verificationKey,
	ready: true
};
export type API = typeof api;
Comlink.expose(api);
self.postMessage('ready');
