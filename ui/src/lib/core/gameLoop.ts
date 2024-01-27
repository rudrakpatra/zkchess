import { Field, PrivateKey, Signature, verify } from 'o1js';
import type { Writable } from 'svelte/store';
import type { GameState } from 'zkchess-contracts';
import { PvPChessProgramProof, PvPChessProgram, RollupState, GameResult } from 'zkchess-contracts';

type Agent = {
	getMove(proof: PvPChessProgramProof): Promise<PvPChessProgramProof>;
};

class GameLoop {
	private gameState: Writable<GameState>;

	public async start(white: Agent, black: Agent, initialGameState: GameState) {
		const agents = [white, black];
		const { verificationKey } = await PvPChessProgram.compile(); // TODO caching
		let state = initialGameState;
		this.gameState.set(state);
		let step = 0;
		let ended = false;
		let proof = await PvPChessProgram.start(
			{} as RollupState,
			Signature.create(PrivateKey.random(), [Field(1)]),
			Signature.create(PrivateKey.random(), [Field(1)])
		);
		while (!ended) {
			const currAgentId = step % 2;
			const currAgent = agents[currAgentId];
			// step 1: get Move and Proof from Agent
			console.log('%c Waiting for response from agent', 'color: brown;', {
				currAgent
			});
			const nextProof = await currAgent.getMove(proof);

			// step 2: verify the Proof
			if (!(await verify(nextProof.toJSON(), verificationKey.data))) {
				console.warn('Invalid proof received from agent', { currAgent }, step);
			}
			proof = nextProof;
			state = nextProof.publicOutput;
			this.gameState.set(state);
			step++;
			// step 3: check if game ended
			const result = Number(state.result.toBigInt());
			if ([GameResult.BLACK_WINS, GameResult.WHITE_WINS, GameResult.DRAW].includes(result)) {
				ended = true;
			}
		}
	}
}

export default GameLoop;
