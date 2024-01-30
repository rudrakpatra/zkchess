import * as Comlink from 'comlink';
import { AccountUpdate, Mina, PrivateKey } from 'o1js';
import { GameState } from 'zkchess-interactive';

const { Chess } = await import('zkchess-interactive');
console.log('compiling');
const before = Date.now();
// await Chess.compile();
const after = Date.now();
console.log('compiled in', (after - before) / 1000);

const proofsEnabled = false;

const Local = Mina.LocalBlockchain({ proofsEnabled });
Mina.setActiveInstance(Local);
const deployer = Local.testAccounts[0];

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
const zkApp = new Chess(zkAppAddress);

async function localDeploy() {
	const txn = await Mina.transaction(deployer.publicKey, () => {
		AccountUpdate.fundNewAccount(deployer.publicKey);
		zkApp.deploy();
	});
	await txn.prove();
	// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
	await txn.sign([deployer.privateKey, zkAppPrivateKey]).send();
}

const whitePlayer = Local.testAccounts[1];
const blackPlayer = Local.testAccounts[2];

await localDeploy();
const txn2 = await Mina.transaction(whitePlayer.publicKey, () => {
	zkApp.start(whitePlayer.publicKey, blackPlayer.publicKey, GameState.fromFEN());
});
await txn2.prove();
await txn2.sign([whitePlayer.privateKey]).send();
console.log(zkApp.getGameState().toAscii());
Comlink.expose(zkApp);
