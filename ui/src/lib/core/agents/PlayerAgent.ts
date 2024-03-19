import { Move, type PromotionRankAsChar } from 'zkchess-interactive';
import { DUMMYPROOF, type Agent, type DUMMYPROOFTYPE } from '../GameLoop';
import type { PrivateKey } from 'o1js';
import { get, writable, type Writable } from 'svelte/store';

export default class PlayerAgent implements Agent {
	turn=writable(false);
	move:Writable<Move|null> = writable(null);

	public placeMove(from: string, to: string,promotion:PromotionRankAsChar) {
		if(get(this.turn))this.move.set(Move.fromLAN(from,to,promotion));
		//if player gives a move before it's turn, then wait for the turn
		this.turn.subscribe(turn=>turn && this.move.set(Move.fromLAN(from,to,promotion)));
	}

	public awaitNextGameStateProof(): Promise<DUMMYPROOFTYPE> {
		if(get(this.move))return Promise.resolve(DUMMYPROOF);
		return new Promise((resolve) => this.move.subscribe((move) => move && resolve(DUMMYPROOF)));
	}
}
