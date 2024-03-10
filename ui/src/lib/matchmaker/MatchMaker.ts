import type { PlayerSignature } from '$lib/zkapp/ZkappWorker';
import { GameState, PvPChessProgramProof } from 'zkchess-interactive';
import type { Peer, DataConnection } from 'peerjs';
import { PrivateKey, PublicKey, Signature } from 'o1js';

type MatchFound={self:PlayerSignature,opponent:PlayerSignature,conn:DataConnection};

export default class MatchMaker {
	private peer: Peer;
	private connected: boolean;
	private conn: DataConnection;
	private startingFEN: string;
	private self: PlayerSignature;
	private opponent: PlayerSignature;
	private matchFoundResolver: (m:MatchFound) => void;

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
		this.matchFoundResolver=()=>{};
	}
	async connect() {
		const { PeerError } = await import('peerjs');
		//return after successful connection
		return await new Promise<{self:PlayerSignature,opponent:PlayerSignature,conn:DataConnection}>((resolvePlayerSignature) => {
			new Promise<DataConnection>((resolve) => {
			this.peer.on('connection', async (newConnection) => {
				if (this.connected) {
					// this can happen when a 3rd player tries to connect
					console.error('MatchMaker: Already connected to an opponent');
					newConnection.emit('error',new PeerError('negotiation-failed', 'Already connected to an opponent'));
					newConnection.close();
					return;
				}
				this.opponent.publicKey = newConnection.peer;
				this.conn = newConnection;
				this.connected = true;
				//listen for signature
				this.conn.on('data', (data) => {
					this.opponent.jsonSignature = JSON.parse(data as string);
					const m={self: this.self, opponent: this.opponent,conn: this.conn};
					this.matchFoundResolver(m);
					resolvePlayerSignature(m);
				});
				resolve(this.conn);
			})}).then((newConn) => {
				//send signature to opponent
				newConn.on('open',()=>{
					console.log('MatchMaker: Connected to opponent ');
					newConn.send(JSON.stringify(this.self.jsonSignature));
				})
			});
		});
	}
	async accept(opponentPubKey: string){
		return await new Promise<MatchFound>((resolvePlayerSignature) => {
			new Promise<DataConnection>((resolve) => {
			this.opponent.publicKey = opponentPubKey;
				//give peerjs some time to breathe
				setTimeout(() => {
					console.log('MatchMaker: Connecting to opponent');
					const connection = this.peer.connect(opponentPubKey, { reliable: true });
					connection.on('open', () => {
						console.log('MatchMaker: Connected to opponent');
						this.connected = true;
						this.conn = connection;
						//listen for signature
						this.conn.on('data', (data) => {
							console.log('MatchMaker: Received Signature from Opponent');
							this.opponent.jsonSignature = JSON.parse(data as string);
							const m={self: this.self, opponent: this.opponent,conn: this.conn};
							this.matchFoundResolver(m);
							resolvePlayerSignature(m);
						});
						resolve(this.conn);
					});
					connection.on('close', () => {
						console.error('MatchMaker: Opponent Closed Connection');
						this.connected = false;
					});
					connection.on('error', (err) => {
						this.connected = false;
						console.error('MatchMaker: not innitiator error: ' + err);
					});
				}, 1000);
			})
			.then((newConn) => {
				//send signature to opponent
				newConn.send(JSON.stringify(this.self.jsonSignature));
			});
		});
	}
	matchfound(){
		return new Promise<MatchFound>((resolve) => this.matchFoundResolver=resolve);
	}
}
