import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';
import { type Chess, ChessMove, type PromotionRankAsChar } from '../../../../contracts/build/src';

let deployerAccount: PublicKey,
	deployerKey: PrivateKey,
	whitePlayerAccount: PublicKey,
	whitePlayerKey: PrivateKey,
	blackPlayerAccount: PublicKey,
	blackPlayerKey: PrivateKey,
	zkAppAddress: PublicKey,
	zkAppPrivateKey: PrivateKey,
	zkApp: Chess;

const proofsEnabled = true;

const init = async () => {
	console.log('importing contract...');
	const { Chess } = await import('../../../../contracts/build/src');

	console.log('compiling...');
	await Chess.compile();

	console.log('setting up local blockchain...');
	const Local = Mina.LocalBlockchain({ proofsEnabled });
	Mina.setActiveInstance(Local);
	({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
	({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } = Local.testAccounts[1]);
	({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } = Local.testAccounts[2]);

	zkAppPrivateKey = PrivateKey.random();
	zkAppAddress = zkAppPrivateKey.toPublicKey();
	console.log('setting up zkApp...');
	zkApp = new Chess(zkAppAddress);

	console.log('setting up zkApp deploy transaction...');
	const deployTxn = await Mina.transaction(deployerAccount, () => {
		AccountUpdate.fundNewAccount(deployerAccount);
		zkApp.deploy();
	});
	console.log('proving transaction...');
	await deployTxn.prove();

	console.log('signing transaction...');
	await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
	console.log('deployed! press start');
};

const start = async () => {
	console.log('starting the game');
	const startTxn = await Mina.transaction(whitePlayerAccount, () => {
		zkApp.start(whitePlayerAccount, blackPlayerAccount);
	});
	console.log('proving transaction...');
	await startTxn.prove();
	console.log('signing transaction...');
	await startTxn.sign([whitePlayerKey]).send();
	console.log('game started!');
	console.log('gamestate:', zkApp.getGameState().toString());
};

const move = async (args: { from: string; to: string; promotion: PromotionRankAsChar }) => {
	console.log('moving...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.move(ChessMove.fromLAN(args.from, args.to, args.promotion));
	});
	console.log('proving transaction...');
	await txn.prove();
	console.log('signing transaction...');
	await txn.sign([playerKey]).send();
	console.log('moved!');
};

const draw = async () => {
	console.log('drawing...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.draw();
	});
	console.log('proving transaction...');
	await txn.prove();
	console.log('signing transaction...');
	await txn.sign([playerKey]).send();
	console.log('drawn!');
};
const resign = async () => {
	console.log('resigning...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.resign();
	});
	console.log('proving transaction...');
	await txn.prove();
	console.log('signing transaction...');
	await txn.sign([playerKey]).send();
	console.log('resigned!');
};

const getState = async () => {
	console.log('getting state...');
	const state = zkApp.getGameState().toString();
	console.log(state);
};

//helpers

const getPlayer = async () => {
	return zkApp.getGameState().turn.toString() === 'true'
		? { playerAccount: whitePlayerAccount, playerKey: whitePlayerKey }
		: { playerAccount: blackPlayerAccount, playerKey: blackPlayerKey };
};

const functions = {
	init,
	start,
	move,
	draw,
	resign,
	getState
};

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
	id: number;
	fn: WorkerFunctions;
	args: unknown;
};

export type ZkappWorkerReponse = {
	id: number;
	data: unknown;
};

onmessage = async (event: MessageEvent<ZkappWorkerRequest>) => {
	const fn = functions[event.data.fn] as (args: unknown) => Promise<unknown>;
	const returnData = await fn(event.data.args);

	const response: ZkappWorkerReponse = {
		id: event.data.id,
		data: returnData
	};
	postMessage(response);
};
