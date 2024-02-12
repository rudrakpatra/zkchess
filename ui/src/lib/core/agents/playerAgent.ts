import type { PvPChessProgramProof } from 'zkchess-contracts';
import type { Agent } from '../gameLoop';
import type { PrivateKey } from 'o1js';
import { Move } from 'zkchess-contracts';

export default class PlayerAgent implements Agent {
	private onMovePlaced: ((move: Move) => void) | undefined;
	private key: PrivateKey;

	getMove(proof: PvPChessProgramProof): Promise<PvPChessProgramProof> {
		// return a promise which gets resolved when onMovePlaced is called
		return new Promise((resolve) => {
			this.onMovePlaced = async (move: Move) => {
				this.onMovePlaced = undefined;
				console.log('player move:', move.toString());

				// calculate next game state
				// TODO
				// const gameObject = new GameObject(proof.publicOutput);
				// const newGameState = gameObject.toUpdated(move);

				console.log('creating proof');
				// await PvPChessProgram.move(rollupState, proof, move, key);
				// TODO use web worker to calculate proof
				resolve(proof);
			};
		});
	}

	/**
	 * Call this when the Player has entered their move using UI
	 * When not player's turn calling this will throw error
	 */
	public placeMove(from: string, to: string): void {
		if (this.onMovePlaced) {
			this.onMovePlaced(Move.fromLAN(from, to));
		} else {
			console.error("onMoveSelected is undefined !! not agent's turn");
		}
	}
}
