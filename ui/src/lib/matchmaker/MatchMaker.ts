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
	private matchFound: MatchFound|null;
	private onMatchFound: (m:MatchFound) => void=()=>{};

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
				this.opponent.publicKey = newConnection.peer;
				this.conn = newConnection;
				this.connected = true;
				//listen for signature
				this.conn.on('data', (data) => {
					this.opponent.jsonSignature = JSON.parse(data as string);
					const m={self: this.self, opponent: this.opponent,conn: this.conn};
					// resolve the match making
					this.matchFound=m;
					this.onMatchFound(m);
					resolveMatchFound(m);
				});
				resolveConn(this.conn);
			})}).then((newConn) => {
				//send signature to opponent
				newConn.on('open',()=>{
					console.log('MatchMaker connect: Connected to opponent ');
					newConn.send(JSON.stringify(this.self.jsonSignature));
				})
			});
		});
	}
	async accept(opponentPubKey: string){
		return await new Promise<MatchFound>((resolveMatchFound) => {
			new Promise<DataConnection>((resolve) => {
			this.opponent.publicKey = opponentPubKey;
				//give peerjs some time to breathe
				setTimeout(() => {
					console.log('MatchMaker accept: Connecting to opponent');
					const connection = this.peer.connect(opponentPubKey, { reliable: true });
					connection.on('open', () => {
						console.log('MatchMaker accept: Connected to opponent');
						this.connected = true;
						this.conn = connection;
						//listen for signature
						this.conn.on('data', (data) => {
							console.log('MatchMaker accept: Received Signature from Opponent');
							this.opponent.jsonSignature = JSON.parse(data as string);
							const m={self: this.self, opponent: this.opponent,conn: this.conn};

							// resolve the match making
							this.matchFound=m;
							this.onMatchFound(m);
							resolveMatchFound(m);
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
				}, 3000);
			})
			.then((newConn) => {
				//send signature to opponent
				newConn.send(JSON.stringify(this.self.jsonSignature));
			});
		});
	}
	awaitMatchFound(){
		console.log('awaitMatchFound: Waiting for match',this.matchFound);
		if(this.matchFound) return Promise.resolve(this.matchFound);
		return new Promise<MatchFound>(resolve => this.onMatchFound=resolve);
	}
}
