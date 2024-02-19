import { verify } from 'o1js';
import type { Writable } from 'svelte/store';
import type { GameState } from 'zkchess-contracts';
import { PvPChessProgramProof, PvPChessProgram, GameResult } from 'zkchess-contracts';

export type Agent = {
	getMove(proof: PvPChessProgramProof): Promise<PvPChessProgramProof>;
};

class GameLoop {
	private gameState: Writable<GameState>;

	public async start(white: Agent, black: Agent, startingProof: PvPChessProgramProof) {
		const agents = [white, black];
		const { verificationKey } = await PvPChessProgram.compile(); // TODO caching
		let step = 0;
		let ended = false;
		let proof = startingProof;
		// let state = startingProof.publicOutput;
		this.gameState.set(startingProof.publicOutput);
		while (!ended) {
			const currAgentId = step % 2;
			const currAgent = agents[currAgentId];

			// step 1: get next Proof from current Agent with
			console.log('%c Waiting for response from agent', 'color: brown;', {
				currAgent
			});
			const nextProof = await currAgent.getMove(proof);

			// step 2: verify the Proof
			if (!(await verify(nextProof.toJSON(), verificationKey))) {
				console.warn('Invalid proof received from agent', { currAgent }, step);
			}
			this.gameState.set(nextProof.publicOutput);

			// step 3: check if game ended
			const result = Number(nextProof.publicOutput.result.toBigInt());
			if ([GameResult.BLACK_WINS, GameResult.WHITE_WINS, GameResult.DRAW].includes(result)) {
				ended = true;
			}

			proof = nextProof;
			step++;
		}
	}
}

export default GameLoop;
