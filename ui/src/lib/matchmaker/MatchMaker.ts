import type { PlayerSignature } from '$lib/zkapp/ZkappWorker';
import { GameState } from 'zkchess-interactive';
import type { Peer, DataConnection } from 'peerjs';
import { PrivateKey, PublicKey, Signature } from 'o1js';

export type MatchFound={self:PlayerSignature,opponent:PlayerSignature,conn:DataConnection};

export default class MatchMaker {
	private peer: Peer;
	private connected: boolean;
	private conn: DataConnection;
	private startingFEN: string;
	private self: PlayerSignature;
	private opponent: PlayerSignature;

	async setup(startingFEN:string,selfPubKey: PublicKey,selfPvtKey: PrivateKey){
		this.startingFEN = startingFEN;

		this.self= {
			publicKey: selfPubKey.toBase58(),
			jsonSignature:
				Signature.create(
					selfPvtKey,
					GameState.fromFEN(this.startingFEN).toFields()
				).toJSON()
		};
		this.opponent = {publicKey: '', jsonSignature: ''};
		const { Peer } = await import('peerjs');
		this.peer = new Peer(this.self.publicKey, {
			host: 'peerjs.92k.de', // TODO: use own peerjs server, https://github.com/Raunaque97/peerjs-server#running-in-google-app-engine
			secure: true,
			debug: 2
		})
	}
	async connect() {
		const { PeerError } = await import('peerjs');
		//return after successful connection
		return await new Promise<MatchFound>((resolveMatchFound) => {
			new Promise<DataConnection>((resolveConn) => {
			this.peer.on('connection', async (newConnection) => {
				if (this.connected) {
					// this can happen when a 3rd player tries to connect
					console.error('MatchMaker connect: Already connected to an opponent');
					newConnection.emit('error',new PeerError('negotiation-failed', 'Already connected to an opponent'));
					newConnection.close();
					return;
				}
				console.log('MatchMaker connect: Connected to opponent');
				this.opponent.publicKey = newConnection.peer;
				this.conn = newConnection;
				this.connected = true;
				//listen for signature
				this.conn.on('data', (data) => {
					this.opponent.jsonSignature = JSON.parse(data as string);
					const m={self: this.self, opponent: this.opponent,conn: this.conn};
					// resolve the match making
					this.conn.removeAllListeners();
					resolveMatchFound(m);
				});
				resolveConn(this.conn);
			})}).then((newConn) => {
				//send signature to opponent
				newConn.on('open',()=>{
					console.log('MatchMaker connect: Sending Signature... ');
					newConn.send(JSON.stringify(this.self.jsonSignature));
				})
			});
			console.log('MatchMaker connect: Connecting to opponent... ');
		});
	}
	async accept(opponentPubKey: string){
		return await new Promise<MatchFound>((resolveMatchFound,rejectMatchFound) => {
			new Promise<DataConnection>((resolve) => {
			this.opponent.publicKey = opponentPubKey;
				//give peerjs some time to breathe
				let tries=5;
				const t=setInterval(() => {
					console.log('MatchMaker accept: Connecting to opponent... ');
					if(--tries==0){
						clearInterval(t);
						rejectMatchFound("Could Not Connect to Opponent");
					}
					const connection = this.peer.connect(opponentPubKey, { reliable: true });
					connection.on('open', () => {
						clearInterval(t);
						console.log('MatchMaker accept: Connected to opponent');
						this.connected = true;
						this.conn = connection;
						//listen for signature
						this.conn.on('data', (data) => {
							console.log('MatchMaker accept: Received Signature from Opponent');
							this.opponent.jsonSignature = JSON.parse(data as string);
							const m={self: this.self, opponent: this.opponent,conn: this.conn};

							// resolve the match making
							this.conn.removeAllListeners();
							resolveMatchFound(m);
						});
						console.log("disturb...")
						resolve(this.conn);
					});
					connection.on('close', () => {
						console.error('MatchMaker accept: Opponent Closed Connection');
						this.connected = false;
					});
					connection.on('error', (err) => {
						console.error('MatchMaker accept: not innitiator error: ' + err);
						this.connected = false;
					});
				}, 1000);
			})
			.then((newConn) => {
				//send signature to opponent
				console.log('MatchMaker accept: Sending Signature... ');
				newConn.send(JSON.stringify(this.self.jsonSignature));
			});
		});
	}
}
