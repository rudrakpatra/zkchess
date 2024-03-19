import { Move } from 'zkchess-interactive';
import { DUMMYPROOF, type Agent, type DUMMYPROOFTYPE } from '../GameLoop';
import type { DataConnection } from 'peerjs';
import { get, writable, type Writable } from 'svelte/store';

export default class NetworkAgent implements Agent {
	private conn: DataConnection;
	turn=writable(false);
	move:Writable<Move|null> = writable(null);

	constructor(conn: DataConnection) {
		this.conn = conn;
		this.conn.on('data', (msg) => {
			console.log("NetworkedAgent: data received: " + msg);
			const {from,to,promotion} = JSON.parse(msg as unknown as string);
			this.move.set(Move.fromLAN(from,to,promotion));
		});
	}

	public awaitNextGameStateProof(): Promise<DUMMYPROOFTYPE> {
		if(get(this.move))return Promise.resolve(DUMMYPROOF);
		return new Promise((resolve) => this.move.subscribe((move) => move && resolve(DUMMYPROOF)));
	}
}
