import * as Comlink from 'comlink';
import type { PromotionRankAsChar } from 'zkchess-interactive';
// let API:Awaited<ReturnType<typeof getAPI>>|undefined;

const getAPI=async()=>{
	const { AccountUpdate, Mina, PublicKey,PrivateKey,Bool}=await import('o1js');
	const { Chess,GameState,Move} = await import('zkchess-interactive');
	console.log('compiling');
	const before = Date.now();
	// // await Chess.compile();
	const after = Date.now();
	console.log('compiled in', (after - before) / 1000);

	const proofsEnabled = false;

	const Local = Mina.LocalBlockchain({ proofsEnabled });
	Mina.setActiveInstance(Local);
	const deployer = Local.testAccounts[0];

	const zkAppPrivateKey = PrivateKey.random();
	const zkAppAddress = zkAppPrivateKey.toPublicKey();
	const zkapp = new Chess(zkAppAddress);

	async function localDeploy() {
		const txn = await Mina.transaction(deployer.publicKey, () => {
			AccountUpdate.fundNewAccount(deployer.publicKey);
			zkapp.deploy();
		});
		await txn.prove();
		// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
		await txn.sign([deployer.privateKey, zkAppPrivateKey]).send();
	}

	const whitePlayer = Local.testAccounts[1];
	const blackPlayer = Local.testAccounts[2];

	console.log('deploying');
	await localDeploy();
	console.log('deployed');
	return {
			//SANDBOX MODE
			start: async (whiteKey: string, blackKey: string, fen?: string) => {
				console.log('starting game in local block chain , SANDBOX MODE');

				const txn = await Mina.transaction(whitePlayer.publicKey, () => {
					zkapp.start(whitePlayer.publicKey, blackPlayer.publicKey, GameState.fromFEN(fen));
				});
				await txn.prove();
				await txn.sign([whitePlayer.privateKey]).send();
			},
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
