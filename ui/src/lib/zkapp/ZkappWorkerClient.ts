import * as Comlink from 'comlink';
import zkAppWorker from './zkAppWorker?worker';
import { GameState, type Chess, Move, type PromotionRankAsChar } from 'zkchess-interactive';
import { Bool, PublicKey } from 'o1js';

const ChessLink: Comlink.Remote<Chess> = Comlink.wrap(new zkAppWorker());
console.log('ChessLink', ChessLink);
export const client = {
	start: async (whiteKey: string, blackKey: string, fen: string) => {
		return await ChessLink.start(
			PublicKey.fromBase58(whiteKey),
			PublicKey.fromBase58(blackKey),
			GameState.fromFEN(fen)
		);
	},
	move: async (from: string, to: string, promotion: PromotionRankAsChar) => {
		return await ChessLink.move(Move.fromLAN(from, to, promotion || 'q'));
	},
	offerDraw: async () => {
		return await ChessLink.offerDraw();
	},
	acceptDraw: async () => {
		return await ChessLink.resolveDraw(Bool(true));
	},
	rejectDraw: async () => {
		return await ChessLink.resolveDraw(Bool(false));
	},
	resign: async () => {
		return await ChessLink.resign();
	},
	getGameState: async () => {
		return await ChessLink.getGameState();
	}
};
