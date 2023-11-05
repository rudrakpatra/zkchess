import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';
import { type Chess, ChessMove, type PromotionRankAsChar } from '../../../contracts/build/src';

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
	postMessage('importing contract...');
	const { Chess } = await import('../../../contracts/build/src');

	postMessage('compiling...');
	await Chess.compile();
	postMessage('compiled!');

	postMessage('setting up local blockchain...');
	const Local = Mina.LocalBlockchain({ proofsEnabled });
	Mina.setActiveInstance(Local);
	({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
	({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } = Local.testAccounts[1]);
	({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } = Local.testAccounts[2]);

	zkAppPrivateKey = PrivateKey.random();
	zkAppAddress = zkAppPrivateKey.toPublicKey();
	postMessage('setting up zkApp...');
	zkApp = new Chess(zkAppAddress);

	postMessage('setting up zkApp deploy transaction...');
	const deployTxn = await Mina.transaction(deployerAccount, () => {
		AccountUpdate.fundNewAccount(deployerAccount);
		zkApp.deploy();
	});
	postMessage('proving transaction...');
	await deployTxn.prove();

	postMessage('signing transaction...');
	await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();
	postMessage('deployed! press start');
};

const start = async () => {
	postMessage('starting the game');
	const startTxn = await Mina.transaction(whitePlayerAccount, () => {
		zkApp.start(whitePlayerAccount, blackPlayerAccount);
	});
	postMessage('proving transaction...');
	await startTxn.prove();
	postMessage('signing transaction...');
	await startTxn.sign([whitePlayerKey]).send();
	postMessage('game started!');
	console.log('gamestate:', zkApp.getGameState().toString());
};

const move = async (from: string, to: string, promotion: string) => {
	postMessage('moving...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.move(ChessMove.fromLAN(from, to, promotion as PromotionRankAsChar));
	});
	postMessage('proving transaction...');
	await txn.prove();
	postMessage('signing transaction...');
	await txn.sign([playerKey]).send();
	postMessage('moved!');
};

const draw = async () => {
	postMessage('drawing...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.draw();
	});
	postMessage('proving transaction...');
	await txn.prove();
	postMessage('signing transaction...');
	await txn.sign([playerKey]).send();
	postMessage('drawn!');
};
const resign = async () => {
	postMessage('resigning...');
	const { playerAccount, playerKey } = await getPlayer();
	const txn = await Mina.transaction(playerAccount, () => {
		zkApp.resign();
	});
	postMessage('proving transaction...');
	await txn.prove();
	postMessage('signing transaction...');
	await txn.sign([playerKey]).send();
	postMessage('resigned!');
};

const getState = async () => {
	postMessage('getting state...');
	const state = zkApp.getGameState().toString();
	postMessage(state);
};

//helpers

const getPlayer = async () => {
	return zkApp.getGameState().turn.toString() === 'true'
		? { playerAccount: whitePlayerAccount, playerKey: whitePlayerKey }
		: { playerAccount: blackPlayerAccount, playerKey: blackPlayerKey };
};

onmessage = function (e) {
	console.log('client->worker:', e.data);
	const { fn, args } = JSON.parse(e.data);
	switch (fn) {
		case 'init':
			init();
			break;
		case 'start':
			start();
			break;
		case 'move':
			move(args.from, args.to, args.promotion);
			break;
		case 'draw':
			draw();
			break;
		case 'resign':
			resign();
			break;
		case 'getState':
			getState();
			break;
		default:
			console.log('client->worker:unknown message:', e.data);
	}
};

console.log('Web Worker Successfully Initialized.');
