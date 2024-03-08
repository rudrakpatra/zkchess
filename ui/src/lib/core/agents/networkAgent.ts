import { PvPChessProgramProof } from 'zkchess-interactive';
import type { Agent } from '../gameLoop';
import type { DataConnection } from 'peerjs';

export default class PlayerAgent implements Agent {
	private onMsgReceive: ((msg: string) => void) | undefined;
	private conn: DataConnection;

	constructor(conn: DataConnection) {
		this.conn = conn;

		conn.on('data', (msg) => {
			// console.log("NetworkedAgent: data received: " + msg);
			if (this.onMsgReceive) {
				this.onMsgReceive(msg!.toString());
			} else {
				console.warn('NetworkedAgent: was not expecting a move:', msg);
			}
		});
	}

	getMove(proof: PvPChessProgramProof): Promise<PvPChessProgramProof> {
		// send proof to the client using peerjs
		this.conn.send(JSON.stringify(proof.toJSON()));

		return new Promise((resolve) => {
			this.onMsgReceive = async (msg) => {
				this.onMsgReceive = undefined;
				console.log('NetworkedAgent msg:', msg);
				resolve(PvPChessProgramProof.fromJSON(JSON.parse(msg)));
			};
		});
	}
}
