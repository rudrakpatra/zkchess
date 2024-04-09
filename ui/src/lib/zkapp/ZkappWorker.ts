import * as Comlink from 'comlink';
import { PublicKey, PrivateKey, Signature, Bool, Field, type JsonProof } from 'o1js';
import {
	GameState,
	GameObject,
	PvPChessProgram,
	PvPChessProgramProof,
	RollupState,
	type PromotionRankAsChar,
	Move,
	GameResult
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
		const newGameState = new GameObject(lastProof.publicOutput,move).getNextGameState();
		const proof= await PvPChessProgramProof.dummy(initialRollupState,newGameState,2);
		jsonProof=proof.toJSON();
	}
	return jsonProof;
}

async function offerDraw(lastProofJSON:JsonProof,privateKey:string) {
	let jsonProof: JsonProof;
	if(proofsEnabled){
		console.log('worker | generating real offerDraw');

		console.time('start');
		jsonProof= (await PvPChessProgram.offerDraw(
		initialRollupState,
		PvPChessProgramProof.fromJSON(lastProofJSON),
		PrivateKey.fromBase58(privateKey)
		)).toJSON();
	}
	else{
		console.log('worker | generating dummy move');
		const lastProof = PvPChessProgramProof.fromJSON(lastProofJSON);
		const gameState = lastProof.publicOutput;
		const newGameState=GameState.from(
			gameState.white,
			gameState.black,
			// gameState.turn,
			gameState.turn.not(),
			gameState.enpassant,
			gameState.kingCastled,
			gameState.column,
			gameState.halfmove,
			//gameState.canDraw,
			Bool(true),
			// gameState.result
			Field(GameResult.ONGOING_OFFERED_DRAW)
		  );
		const proof= await PvPChessProgramProof.dummy(initialRollupState,newGameState,2);
		jsonProof=proof.toJSON();
	}
	return jsonProof;
}

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
