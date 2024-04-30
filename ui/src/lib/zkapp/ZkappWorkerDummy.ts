import type { PlayerConsent } from '$lib/matchmaker/MatchMaker';
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
import * as Comlink from 'comlink';

let verificationKey: {
	data: string;
	hash: Field;
};

let initialRollupState: RollupState;

export type JsonMove = {
	from: string;
	to: string;
	promotion?: PromotionRankAsChar;
};

async function start(white: PlayerConsent, black: PlayerConsent, fen?: string): Promise<JsonProof> {
	initialRollupState = RollupState.from(
		GameState.fromFEN(fen),
		PublicKey.fromBase58(white.publicKey),
		PublicKey.fromBase58(white.proxyKey),
		PublicKey.fromBase58(black.publicKey),
		PublicKey.fromBase58(black.proxyKey)
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, GameState.fromFEN(fen), 2)).toJSON();
}

async function move(
	moveJson: JsonMove,
	lastProofJSON: JsonProof,
	privateKeyBase58: string
): Promise<JsonProof> {
	console.log('move', moveJson);
	const move = Move.fromLAN(moveJson.from, moveJson.to, moveJson.promotion || 'q');
	const lastProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const newGameState = new GameObject(lastProof.publicOutput, move).getNextGameState();
	return (await PvPChessProgramProof.dummy(initialRollupState, newGameState, 2)).toJSON();
}

async function offerDraw(lastProofJSON: JsonProof, privateKeyBase58: string): Promise<JsonProof> {
	const lastProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const gameState = lastProof.publicOutput;
	const newGameState = GameState.from(
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
	return (await PvPChessProgramProof.dummy(initialRollupState, newGameState, 2)).toJSON();
}
async function acceptDraw(
	accept: boolean,
	lastProofJSON: JsonProof,
	privateKeyBase58: string
): Promise<JsonProof> {
	const lastProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const gameState = lastProof.publicOutput;
	const newGameState = GameState.from(
		gameState.white,
		gameState.black,
		// gameState.turn,
		gameState.turn.not(),
		gameState.enpassant,
		gameState.kingCastled,
		gameState.column,
		gameState.halfmove,
		//gameState.canDraw,
		Bool(false),
		// gameState.result
		accept ? Field(GameResult.DRAW) : Field(GameResult.ONGOING)
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, newGameState, 2)).toJSON();
}
async function resign(lastProofJSON: JsonProof, privateKeyBase58: string): Promise<JsonProof> {
	const lastProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const gameState = lastProof.publicOutput;
	const newGameState = GameState.from(
		gameState.white,
		gameState.black,
		// gameState.turn,
		gameState.turn.not(),
		gameState.enpassant,
		gameState.kingCastled,
		gameState.column,
		gameState.halfmove,
		//gameState.canDraw,
		Bool(false),
		// gameState.result
		gameState.turn.toBoolean() ? Field(GameResult.BLACK_WINS) : Field(GameResult.WHITE_WINS)
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, newGameState, 2)).toJSON();
}

verificationKey = { data: '', hash: Field.from(0) };
console.warn('using PvPChessProgramDummy');

const api = {
	start,
	move,
	offerDraw,
	acceptDraw,
	resign,
	// getFEN,
	// getPlayerRating
	verificationKey,
	ready: true
};
export type API = typeof api;
Comlink.expose(api);
self.postMessage('ready');
