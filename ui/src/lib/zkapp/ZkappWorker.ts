import * as Comlink from 'comlink';
import { dummyBase64Proof } from 'o1js/dist/node/lib/proof-system';
import { Pickles } from 'o1js/dist/node/snarky';
import { AccountUpdate, Mina, PublicKey,PrivateKey,Bool, Signature} from 'o1js';
import {GameState, PvPChessProgram, PvPChessProgramProof, RollupState, type PromotionRankAsChar} from "zkchess-interactive";
const [, dummy] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);


let time;
const proofsEnabled = false;
let initialRollupState:RollupState;
export type Player={
	publicKey:string,
	signedJSONForStartingGame:Signature,
}

async function start(white:Player, black:Player, fen?: string) {
	if(proofsEnabled){
		console.log('worker | generating real start');
		initialRollupState=RollupState.from(
			GameState.fromFEN(fen),
			PublicKey.fromBase58(white.publicKey),
			PublicKey.fromBase58(black.publicKey)
		);
		console.time('start');
		const proof0= await PvPChessProgram.start(
		initialRollupState,
		Signature.fromJSON(white.signedJSONForStartingGame),
		Signature.fromJSON(black.signedJSONForStartingGame)
		);
		console.timeEnd('start');
		return proof0;
	}
	else{
		console.log('worker | generating dummy start');

		return new PvPChessProgramProof({
			proof: dummy,
			publicInput: RollupState.from(GameState.fromFEN(fen), PublicKey.fromBase58(white.publicKey), PublicKey.fromBase58(black.publicKey)),
			publicOutput: GameState.fromFEN(fen),
			maxProofsVerified: 2
		}).toJSON();
	}
}
async function move(from: string, to: string, promotion:PromotionRankAsChar) {
	if(proofsEnabled){
		console.log('worker | generating real move');

		console.time('start');
		const proof0= await PvPChessProgram.move(
		initialRollupState,
		Signature.fromJSON(white.signedJSONForStartingGame),
		Signature.fromJSON(black.signedJSONForStartingGame)
		);
		console.timeEnd('start');
		return proof0;
	}
	else{
		console.log('worker | generating dummy move');
		
		return new PvPChessProgramProof({
			proof: dummy,
			publicInput: RollupState.from(GameState.fromFEN(fen), PublicKey.fromBase58(white.publicKey), PublicKey.fromBase58(black.publicKey)),
			publicOutput: GameState.fromFEN(fen),
			maxProofsVerified: 2
		}).toJSON();
	}
}
			move: async (from: string, to: string, promotion:PromotionRankAsChar) => {
				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
					zkapp.move(Move.fromLAN(from, to, promotion || 'q'));
				});
				await txn.prove();
				await txn.sign([whitePlayer.privateKey]).send();
			},
			offerDraw: async () => {
				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
					zkapp.offerDraw();
				});
				await txn.prove();
				await txn.sign([whitePlayer.privateKey]).send();
			},
			acceptDraw: async () => {
				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
					zkapp.resolveDraw(Bool(true));
				});
				await txn.prove();
				await txn.sign([whitePlayer.privateKey]).send();
			},
			rejectDraw: async () => {
				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
					zkapp.resolveDraw(Bool(false));
				});
				await txn.prove();
				await txn.sign([whitePlayer.privateKey]).send();
			},
			resign: async () => {
				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
					zkapp.resign();
				});
				await txn.prove();
				await txn.sign([whitePlayer.privateKey]).send();
			},
			getFEN: async () => {
				return zkapp.getGameState().toFEN();
			},
			getPlayerRating: async (publicKey: string) => {
				return Number(zkapp.getPlayerRating(PublicKey.fromBase58(publicKey)).toBigInt());
			}
	}
}


const exposed=await getAPI();
Comlink.expose(exposed);
postMessage('ready');

export type ZkappWorkerAPI =typeof exposed;
