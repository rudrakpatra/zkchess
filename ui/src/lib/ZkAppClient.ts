import { AccountUpdate, Mina, PrivateKey, PublicKey } from 'o1js';
import { type Chess, ChessMove, type PromotionRankAsChar } from '../../../contracts/build/src';

export class ZkAppClient {
	proofsEnabled: boolean;

	deployerAccount: PublicKey;
	deployerKey: PrivateKey;
	whitePlayerAccount: PublicKey;
	whitePlayerKey: PrivateKey;
	blackPlayerAccount: PublicKey;
	blackPlayerKey: PrivateKey;
	zkAppAddress: PublicKey;
	zkAppPrivateKey: PrivateKey;
	zkApp: Chess;

	setMessage: (msg: string) => void;

	constructor(proofsEnabled = true) {
		this.proofsEnabled = proofsEnabled;
	}
	async init() {
		this.setMessage('importing contract...');
		const { Chess } = await import('../../../contracts/build/src');

		this.setMessage('compiling...');
		await Chess.compile();
		this.setMessage('compiled!');

		this.setMessage('setting up local blockchain...');
		const Local = Mina.LocalBlockchain({ proofsEnabled: this.proofsEnabled });
		Mina.setActiveInstance(Local);
		({ privateKey: this.deployerKey, publicKey: this.deployerAccount } = Local.testAccounts[0]);
		({ privateKey: this.whitePlayerKey, publicKey: this.whitePlayerAccount } =
			Local.testAccounts[1]);
		({ privateKey: this.blackPlayerKey, publicKey: this.blackPlayerAccount } =
			Local.testAccounts[2]);

		this.zkAppPrivateKey = PrivateKey.random();
		this.zkAppAddress = this.zkAppPrivateKey.toPublicKey();
		this.setMessage('setting up zkApp...');
		this.zkApp = new Chess(this.zkAppAddress);

		this.setMessage('setting up zkApp deploy transaction...');
		const deployTxn = await Mina.transaction(this.deployerAccount, () => {
			AccountUpdate.fundNewAccount(this.deployerAccount);
			this.zkApp.deploy();
		});
		this.setMessage('proving transaction...');
		await deployTxn.prove();
		// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
		this.setMessage('signing transaction...');
		await deployTxn.sign([this.deployerKey, this.zkAppPrivateKey]).send();
		this.setMessage('deployed! press start');
	}
	async start() {
		this.setMessage('starting the game');

		const startTxn = await Mina.transaction(this.whitePlayerAccount, () => {
			this.zkApp.start(this.whitePlayerAccount, this.blackPlayerAccount);
		});
		this.setMessage('proving transaction...');
		await startTxn.prove();
		this.setMessage('signing transaction...');
		await startTxn.sign([this.whitePlayerKey]).send();
		this.setMessage('game started!');
		console.log('gamestate:', this.zkApp.getGameState().toString());
	}
	async move(from: string, to: string, promotion: string) {
		this.setMessage('making move...');
		const moveTxn = await Mina.transaction(this.whitePlayerAccount, () => {
			this.zkApp.move(ChessMove.fromLAN(from, to, promotion as PromotionRankAsChar));
		});
		this.setMessage('proving transaction...');
		await moveTxn.prove();
		this.setMessage('signing transaction...');
		await moveTxn.sign([this.whitePlayerKey]).send();
		this.setMessage('moved!');
		console.log('gamestate:', this.zkApp.getGameState().toString());
	}
	async draw() {
		this.setMessage('drawing...');
		const drawTxn = await Mina.transaction(this.whitePlayerAccount, () => {
			this.zkApp.draw();
		});
		this.setMessage('proving transaction...');
		await drawTxn.prove();
		this.setMessage('signing transaction...');
		await drawTxn.sign([this.whitePlayerKey]).send();
		this.setMessage('drawn!');
		console.log('gamestate:', this.zkApp.getGameState().toString());
	}
	async resign() {
		this.setMessage('resigning...');
		const resignTxn = await Mina.transaction(this.whitePlayerAccount, () => {
			this.zkApp.resign();
		});
		this.setMessage('proving transaction...');
		await resignTxn.prove();
		this.setMessage('signing transaction...');
		await resignTxn.sign([this.whitePlayerKey]).send();
		this.setMessage('resigned!');
		console.log('gamestate:', this.zkApp.getGameState().toString());
	}
	getState() {
		return this.zkApp.getGameState().toString();
	}
	onmessage(cb: (msg: string) => void) {
		this.setMessage = cb;
	}
}
