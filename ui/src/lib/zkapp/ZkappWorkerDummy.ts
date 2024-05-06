import type { PlayerConsent } from '$lib/matchmaker/MatchMaker';
import {
	PublicKey,
	PrivateKey,
	Signature,
	Bool,
	Field,
	type JsonProof,
	Mina,
	AccountUpdate
} from 'o1js';
import {
	GameState,
	PvPChessProgramMethods,
	PvPChessProgramProof,
	RollupState,
	type PromotionRankAsChar,
	Move,
	ChessContract
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
	const whiteSign = Signature.fromBase58(JSON.parse(white.jsonSignature).signature);
	const blackSign = Signature.fromBase58(JSON.parse(black.jsonSignature).signature);
	const output = await PvPChessProgramMethods.start.method(
		initialRollupState,
		whiteSign,
		blackSign
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, output, 2)).toJSON();
}

async function move(
	moveJson: JsonMove,
	lastProofJSON: JsonProof,
	privateKeyBase58: string
): Promise<JsonProof> {
	const move = Move.fromLAN(moveJson.from, moveJson.to, moveJson.promotion || 'q');
	const lastProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const privateKey = PrivateKey.fromBase58(privateKeyBase58);
	const output = await PvPChessProgramMethods.move.method(
		lastProof.publicInput,
		lastProof,
		move,
		privateKey
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, output, 2)).toJSON();
}

async function offerDraw(lastProofJSON: JsonProof, privateKeyBase58: string): Promise<JsonProof> {
	const earlierProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const privateKey = PrivateKey.fromBase58(privateKeyBase58);
	const output = await PvPChessProgramMethods.offerDraw.method(
		earlierProof.publicInput,
		earlierProof,
		privateKey
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, output, 2)).toJSON();
}
async function acceptDraw(
	accept: boolean,
	lastProofJSON: JsonProof,
	privateKeyBase58: string
): Promise<JsonProof> {
	const earlierProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const privateKey = PrivateKey.fromBase58(privateKeyBase58);
	const output = await PvPChessProgramMethods.resolveDraw.method(
		earlierProof.publicInput,
		earlierProof,
		Bool(accept),
		privateKey
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, output, 2)).toJSON();
}
async function resign(lastProofJSON: JsonProof, privateKeyBase58: string): Promise<JsonProof> {
	const earlierProof = await PvPChessProgramProof.fromJSON(lastProofJSON);
	const privateKey = PrivateKey.fromBase58(privateKeyBase58);
	const output = await PvPChessProgramMethods.resign.method(
		earlierProof.publicInput,
		earlierProof,
		privateKey
	);
	return (await PvPChessProgramProof.dummy(initialRollupState, output, 2)).toJSON();
}

//ChessContract Methods

//CURRENTLY NOT SENDING TO MINA BLOCKCHAIN

const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);

const deployerKey = Local.testAccounts[0].key;
const deployerAccount = deployerKey.toPublicKey();
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
const zkApp = new ChessContract(zkAppAddress);

async function localDeploy() {
	console.log('Deploying zkApp');
	const txn = await Mina.transaction(deployerAccount, async () => {
		AccountUpdate.fundNewAccount(deployerAccount);
		await zkApp.deploy();
	});
	await txn.prove();
	// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
	await txn.sign([deployerKey, zkAppPrivateKey]).send();
}
await localDeploy();

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

async function createSubmitTransactionJSON(proof: JsonProof) {
	return (
		await Mina.transaction(deployerAccount, async () => {
			zkApp.submitMatchResult(await PvPChessProgramProof.fromJSON(proof));
		})
	).toJSON();
}
async function getRating(publicKeyBase58: string) {
	return zkApp.getPlayerRating(PublicKey.fromBase58(publicKeyBase58)).toString();
}

verificationKey = { data: '', hash: Field.from(0) };
console.warn('using PvPChessProgramDummy');

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
	verificationKey,
	ready: true
};
export type API = typeof api;
Comlink.expose(api);
self.postMessage('ready');
