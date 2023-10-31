import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';

import { Path, Position, type Chess } from '../../../contracts/build/src';
// ---------------------------------------------------------------------------------------

let deployerAccount: PublicKey,
	deployerKey: PrivateKey,
	whitePlayerAccount: PublicKey,
	whitePlayerKey: PrivateKey,
	blackPlayerAccount: PublicKey,
	blackPlayerKey: PrivateKey,
	zkAppAddress: PublicKey,
	zkAppPrivateKey: PrivateKey,
	zkApp: Chess;

const proofsEnabled = false;

// ---------------------------------------------------------------------------------------
async function localDeploy() {
	const txn = await Mina.transaction(deployerAccount, () => {
		AccountUpdate.fundNewAccount(deployerAccount);
		zkApp.deploy();
	});
	await txn.prove();
	// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
	await txn.sign([deployerKey, zkAppPrivateKey]).send();
}
// ---------------------------------------------------------------------------------------
const functions = {
	init: async () => {
		const { Chess } = await import('../../../contracts/build/src');
		console.log('imported', Chess);
		console.log('compiling...');
		await Chess.compile();
		console.log('compiled!');

		const Local = Mina.LocalBlockchain({ proofsEnabled });
		Mina.setActiveInstance(Local);
		({ privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0]);
		({ privateKey: whitePlayerKey, publicKey: whitePlayerAccount } = Local.testAccounts[1]);
		({ privateKey: blackPlayerKey, publicKey: blackPlayerAccount } = Local.testAccounts[2]);
		zkAppPrivateKey = PrivateKey.random();
		zkAppAddress = zkAppPrivateKey.toPublicKey();
		zkApp = new Chess(zkAppAddress);
		await localDeploy();
	},

	start: async () => {
		const txn = await Mina.transaction(whitePlayerAccount, () =>
			zkApp.start(whitePlayerAccount, blackPlayerAccount)
		);
		await txn.prove();
		await txn.sign([whitePlayerKey]).send();
	},
	move: async (args: string) => {
		const { posArray, promotion, player } = JSON.parse(args);
		const path = Path.from(posArray.map((x: number, y: number) => Position.from(x, y)));
		let txn;
		switch (player) {
			case 'w':
				txn = await Mina.transaction(whitePlayerAccount, () => zkApp.move(path, Field(promotion)));
				await txn.prove();
				await txn.sign([whitePlayerKey]).send();
				break;
			case 'b':
				txn = await Mina.transaction(blackPlayerAccount, () => zkApp.move(path, Field(promotion)));
				await txn.prove();
				await txn.sign([blackPlayerKey]).send();
				break;
		}
	},
	getBoard: async () => {
		const board = await zkApp!.getBoard();
		return JSON.stringify(board.display());
	}
};
// ---------------------------------------------------------------------------------------

if (typeof window !== 'undefined') {
	addEventListener('message', async (event: MessageEvent<string>) => {
		console.log('ZkappWorker received message:', event.data);
		const { fn, args } = JSON.parse(event.data);
		switch (fn) {
			case 'init':
				await functions.init();
				postMessage(true);
				break;
			case 'start':
				await functions.start();
				postMessage(true);
				break;
			case 'move':
				await functions.move(args);
				postMessage(true);
				break;
			case 'getBoard':
				postMessage(await functions.getBoard());
				break;
			default:
				console.log('ZkappWorker received unknown message:', event.data);
		}
	});
}

console.log('Web Worker Successfully Initialized.');
