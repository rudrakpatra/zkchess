import type { PlayerSignature } from '$lib/zkapp/ZkappWorker';
import { GameState, PvPChessProgramProof } from 'zkchess-interactive';
import { Peer, PeerError, DataConnection } from 'peerjs';
import { PrivateKey, Signature } from 'o1js';

export default class MatchMaker {
	private peer: Peer;
	private connected: boolean;
	private conn: DataConnection;
	private startingFEN: string;
	private self: PlayerSignature;
	private opponent: PlayerSignature;

	private selfPubKey: string;
	private opponentPubKey: string;
	/**
	 * adds selfPubKey and opponentPubKey to the class
	 * @param startingFEN
	 * @param selfPubKey
	 * @param opponentPubKey
	 * @returns connection to the opponent
	 */
	async connect(startingFEN: string, selfPubKey: string, opponentPubKey?: string) {
		this.startingFEN = startingFEN;
		this.selfPubKey = selfPubKey;
		this.peer = new Peer(selfPubKey.toLowerCase(), {
			host: 'peerjs.92k.de', // TODO: use own peerjs server, https://github.com/Raunaque97/peerjs-server#running-in-google-app-engine
			secure: true,
			debug: 2
		});
		return await new Promise<DataConnection>((resolve) => {
			if (opponentPubKey) {
				this.opponentPubKey = opponentPubKey;
				this.conn = this.peer.connect(opponentPubKey, { reliable: true });
				this.conn.on('open', () => {
					this.connected = true;
					resolve(this.conn);
				});
				this.conn.on('close', () => {
					console.error('Network/peerConn, Opponent Closed Connection');
					this.connected = false;
				});
				this.conn.on('error', (err) => {
					this.connected = false;
					console.error('Network/peerConn, not innitiator error: ' + err);
				});
			} else {
				this.peer.on('connection', (connection) => {
					this.opponentPubKey = connection.peer;
					if (this.connected) {
						// this can happen when a 3rd player tries to connect
						console.warn('Network: Already connected to an opponent');
						connection.emit(
							'error',
							new PeerError('negotiation-failed', 'Already connected to an opponent')
						);
						connection.close();
						return;
					}
					this.conn = connection;
					this.connected = true;
					resolve(this.conn);
				});
				this.peer.on('error', (err) => {
					this.connected = false;
					console.error('Network: Network/peer error: ' + err);
				});
			}
		});
	}

	private async fetchPlayerSignatures(selfPvtKey: PrivateKey) {
		return new Promise<void>((resolve) => {
			if (this.selfPubKey < this.opponentPubKey) {
				this.conn.on('data', (msg) => {
					this.opponent = {
						publicKey: this.opponentPubKey,
						jsonSignature: JSON.parse(msg as string)
					};
					resolve();
				});
				this.self = {
					publicKey: this.selfPubKey,
					jsonSignature: Signature.create(
						selfPvtKey,
						GameState.fromFEN(this.startingFEN).toFields()
					).toJSON()
				};
				// send self signature to opponent
				this.conn.send(JSON.stringify(this.self.jsonSignature));
			} else {
				this.conn.on('data', (msg) => {
					this.opponent = {
						publicKey: this.opponentPubKey,
						jsonSignature: JSON.parse(msg as string)
					};
					this.self = {
						publicKey: this.selfPubKey,
						jsonSignature: Signature.create(
							selfPvtKey,
							GameState.fromFEN(this.startingFEN).toFields()
						).toJSON()
					};
					// send self signature to opponent
					this.conn.send(JSON.stringify(this.self.jsonSignature));
					resolve();
				});
			}
		});
	}
	public async createStartingProof(selfPvtKey: PrivateKey) {
		const { workerClient, awaitWorker } = await import('$lib/zkapp/ZkappWorkerClient');
		await awaitWorker(); //wait for the worker to be ready
		await this.fetchPlayerSignatures(selfPvtKey);
		return PvPChessProgramProof.fromJSON(
			await workerClient.start(this.self, this.opponent, this.startingFEN)
		) as PvPChessProgramProof;
	}
}
