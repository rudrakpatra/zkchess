import type { PlayerConsent } from '$lib/matchmaker/MatchMaker';
import {
	PublicKey,
	PrivateKey,
	Signature,
	Field,
	type JsonProof,
	Mina
	// AccountUpdate
} from 'o1js';
import {
	GameState,
	PvPChessProgramProof,
	RollupState,
	type PromotionRankAsChar,
	Move,
	ChessContract,
	GameObject,
	PvPChessProgram
} from 'zkchess-interactive';
import * as Comlink from 'comlink';

let chessProgramvkey: {
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
	console.log(`%c start:${fen}\n`, 'color:#eeff33;');
	console.log('start...');
	console.time('start');
	const jsonProof = (
		await PvPChessProgram.start(
			initialRollupState,
			Signature.fromJSON(white.jsonSignature),
			Signature.fromJSON(black.jsonSignature)
		)
	).toJSON();
	console.timeEnd('start');
	return jsonProof;
}
async function move(
	moveJson: JsonMove,
	lastProofJSON: JsonProof,
	privateKeyBase58: string
): Promise<JsonProof> {
	const move = Move.fromLAN(moveJson.from, moveJson.to, moveJson.promotion || 'q');
	const lastProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const privateKey = PrivateKey.fromBase58(privateKeyBase58);

	const output = new GameObject(lastProof.publicOutput, move).getNextGameState();
	console.log('move...');
	console.time('move');
	const jsonProof = (
		await PvPChessProgram.move(
			initialRollupState,
			PvPChessProgramProof.fromJSON(lastProofJSON),
			move,
			privateKey
		)
	).toJSON();
	console.timeEnd('move');
	return jsonProof;
}

async function offerDraw(lastProofJSON: JsonProof, privateKey: string) {
	console.log('offerDraw...');
	console.time('offerDraw');
	const jsonProof = (
		await PvPChessProgram.offerDraw(
			initialRollupState,
			PvPChessProgramProof.fromJSON(lastProofJSON),
			PrivateKey.fromBase58(privateKey)
		)
	).toJSON();
	console.timeEnd('offerDraw');
	return jsonProof;
}

async function acceptDraw(
	accept: boolean,
	lastProofJSON: JsonProof,
	privateKeyBase58: string
): Promise<JsonProof> {
	console.log('acceptDraw...');
	console.time('acceptDraw');
	const privateKey = PrivateKey.fromBase58(privateKeyBase58);
	const jsonProof = (
		await PvPChessProgram.resolveDraw(
			initialRollupState,
			PvPChessProgramProof.fromJSON(lastProofJSON),
			privateKey
		)
	).toJSON();
	console.timeEnd('acceptDraw');
	return jsonProof;
}
async function resign(lastProofJSON: JsonProof, privateKeyBase58: string): Promise<JsonProof> {
	console.log('resign...');
	console.time('resign');
	const earlierProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const privateKey = PrivateKey.fromBase58(privateKeyBase58);
	const jsonProof = (
		await PvPChessProgram.resign(
			initialRollupState,
			PvPChessProgramProof.fromJSON(lastProofJSON),
			privateKey
		)
	).toJSON();
	console.timeEnd('resign');
	return jsonProof;
}

const MINAURL = 'https://proxy.devnet.minaexplorer.com/graphql';
const ARCHIVEURL = 'https://archive.devnet.minaexplorer.com';
const network = Mina.Network({
	mina: MINAURL,
	archive: ARCHIVEURL
});
Mina.setActiveInstance(network);

console.log('compiling PvPChessProgram...');
console.time('compiling PvPChessProgram');
const chessProgramVkey = (await PvPChessProgram.compile()).verificationKey;
console.timeEnd('compiling PvPChessProgram');

console.log('compiling ChessContract...');
console.time('compiling ChessContract');
const chessContractVKey = (await ChessContract.compile()).verificationKey;
console.timeEnd('compiling ChessContract');

const zkAppAddress = PublicKey.fromBase58(
	'B62qkeMyPbYuwfwXkhwMXYLvphQLrgfKUcvkEhuMD1PYdcRyDsxDvuf'
);
const zkApp = new ChessContract(zkAppAddress);

export type TransactionProof = string;
async function proveTransactionJSON(transactionProof: TransactionProof) {
	return (await Mina.Transaction.fromJSON(transactionProof).prove()).toJSON();
}
async function createrRegisterTransactionJSON(senderAddress: string) {
	return (
		await Mina.transaction(PublicKey.fromBase58(senderAddress), async () => {
			zkApp.enableRankings();
		})
	).toJSON();
}

async function createSubmitTransactionJSON(proof: JsonProof, senderBase58: string) {
	return (
		await Mina.transaction(PublicKey.fromBase58(senderBase58), async () => {
			zkApp.submitMatchResult(await PvPChessProgramProof.fromJSON(proof));
		})
	).toJSON();
}
async function getRating(publicKeyBase58: string) {
	return zkApp.getPlayerRating(PublicKey.fromBase58(publicKeyBase58)).toString();
}

const api = {
	//zkapp methods
	start,
	move,
	offerDraw,
	acceptDraw,
	resign,
	//contract methods
	proveTransaction: proveTransactionJSON,
	createrRegisterTransactionJSON: createrRegisterTransactionJSON,
	createSubmitTransaction: createSubmitTransactionJSON,
	getRating,
	chessProgramVkey,
	chessContractVKey,
	ready: true
};
export type API = typeof api;
Comlink.expose(api);
self.postMessage('ready');
