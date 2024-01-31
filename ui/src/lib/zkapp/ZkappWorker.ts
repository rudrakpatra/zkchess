import * as Comlink from 'comlink';
// import { AccountUpdate, Bool, Mina, PrivateKey, PublicKey } from 'o1js';
import { GameState, Move, type PromotionRankAsChar } from 'zkchess-interactive';

const { Chess } = await import('zkchess-interactive');
console.log('compiling');
const before = Date.now();
// // await Chess.compile();
const after = Date.now();
console.log('compiled in', (after - before) / 1000);

// const proofsEnabled = false;

// const Local = Mina.LocalBlockchain({ proofsEnabled });
// Mina.setActiveInstance(Local);
// const deployer = Local.testAccounts[0];

// const zkAppPrivateKey = PrivateKey.random();
// const zkAppAddress = zkAppPrivateKey.toPublicKey();
// const zkApp = new Chess(zkAppAddress);

// async function localDeploy() {
// 	const txn = await Mina.transaction(deployer.publicKey, () => {
// 		AccountUpdate.fundNewAccount(deployer.publicKey);
// 		zkApp.deploy();
// 	});
// 	await txn.prove();
// 	// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
// 	await txn.sign([deployer.privateKey, zkAppPrivateKey]).send();
// }

// const whitePlayer = Local.testAccounts[1];
// const blackPlayer = Local.testAccounts[2];

// console.log('deploying');
// await localDeploy();
// console.log('deployed');

// const client = {
// 	//SANDBOX
// 	whitePlayer: whitePlayer.publicKey.toBase58(),
// 	blackPlayer: blackPlayer.publicKey.toBase58(),
// 	zkAppAddress: zkAppAddress.toBase58(),

// 	start: async (whiteKey: string, blackKey: string, fen: string) => {
// 		const whitePlayerKey = PublicKey.fromBase58(whiteKey);
// 		const blackPlayerKey = PublicKey.fromBase58(blackKey);
// 		const txn = await Mina.transaction(whitePlayerKey, () => {
// 			zkApp.start(whitePlayerKey, blackPlayerKey, GameState.fromFEN(fen));
// 		});
// 		await txn.prove();
// 		await txn.sign([whitePlayer.privateKey]).send();
// 		return zkApp.getGameState().toAscii();
// 	},
// 	move: async (from: string, to: string, promotion: PromotionRankAsChar) => {
// 		return await zkApp.move(Move.fromLAN(from, to, promotion || 'q'));
// 	},
// 	offerDraw: async () => {
// 		return await zkApp.offerDraw();
// 	},
// 	acceptDraw: async () => {
// 		return await zkApp.resolveDraw(Bool(true));
// 	},
// 	rejectDraw: async () => {
// 		return await zkApp.resolveDraw(Bool(false));
// 	},
// 	resign: async () => {
// 		return await zkApp.resign();
// 	},
// 	getGameState: async () => {
// 		return await zkApp.getGameState();
// 	}
// };

const client = {
	counter: 0,
	inc() {
		this.counter++;
	}
};

export type zkAppWorkerAPI = typeof client;

Comlink.expose(client);
