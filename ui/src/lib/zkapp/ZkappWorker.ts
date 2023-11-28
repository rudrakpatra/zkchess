import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';
import { type Chess, Move, type PromotionRankAsChar } from 'zkchess-contracts';

let deployerAccount: PublicKey,
	deployerKey: PrivateKey,
	whitePlayerAccount: PublicKey,
	whitePlayerKey: PrivateKey,
	blackPlayerAccount: PublicKey,
	blackPlayerKey: PrivateKey,
	zkAppAddress: PublicKey,
	zkAppPrivateKey: PrivateKey,
	zkApp: Chess;

const decoratedLog = (...args: string[]) => console.log('%c' + args.join(' '), 'color: #00ffee');
const proofsEnabled = true;

const init = async () => {
	decoratedLog('importing contract...');
	const { Chess } = await import('zkchess-contracts');

	decoratedLog('compiling...');
	await Chess.compile();

	decoratedLog('setting up local blockchain...');
	const Local = Mina.LocalBlockchain({ proofsEnabled });
	Mina.setActiveInstance(Local);
	({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
	({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } = Local.testAccounts[1]);
	({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } = Local.testAccounts[2]);

	zkAppPrivateKey = PrivateKey.random();
	zkAppAddress = zkAppPrivateKey.toPublicKey();
	decoratedLog('setting up zkApp...');
	zkApp = new Chess(zkAppAddress);

	decoratedLog('setting up zkApp deploy transaction...');
	const deployTxn = await Mina.transaction(deployerAccount, () => {
		AccountUpdate.fundNewAccount(deployerAccount);
		zkApp.deploy();
	});
	decoratedLog('proving transaction...');
	await deployTxn.prove();

	decoratedLog('signing transaction...');
	await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
	decoratedLog('deployed! press start');
};

const start = async () => {
	decoratedLog('starting the game');
	const startTxn = await Mina.transaction(whitePlayerAccount, () => {
		zkApp.start(whitePlayerAccount, blackPlayerAccount);
	});
	decoratedLog('proving transaction...');
	await startTxn.prove();
	decoratedLog('signing transaction...');
	await startTxn.sign([whitePlayerKey]).send();
	decoratedLog('game started!');
	decoratedLog('gamestate:', zkApp.getGameState().toString());
};

const move = async (args: { from: string; to: string; promotion: PromotionRankAsChar }) => {
	decoratedLog('moving...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.move(Move.fromLAN(args.from, args.to, args.promotion));
	});
	decoratedLog('proving transaction...');
	await txn.prove();
	decoratedLog('signing transaction...');
	await txn.sign([playerKey]).send();
	decoratedLog('moved!');
};

const draw = async () => {
	decoratedLog('drawing...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.draw();
	});
	decoratedLog('proving transaction...');
	await txn.prove();
	decoratedLog('signing transaction...');
	await txn.sign([playerKey]).send();
	decoratedLog('drawn!');
};
const resign = async () => {
	decoratedLog('resigning...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.resign();
	});
	decoratedLog('proving transaction...');
	await txn.prove();
	decoratedLog('signing transaction...');
	await txn.sign([playerKey]).send();
	decoratedLog('resigned!');
};

const getState = async () => {
	decoratedLog('getting state...');
	const state = zkApp.getGameState().toString();
	decoratedLog(state);
	return state;
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
