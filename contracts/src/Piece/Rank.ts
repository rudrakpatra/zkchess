import { Field } from 'o1js';

export enum RANKS {
  PAWN,
  ROOK,
  KNIGHT,
  BISHOP,
  QUEEN,
  KING,
}

/**
 * pawn can promote to any piece except king , pawn
 * @param rank
 * @returns
 */
export function isRankSuitableForPromotion(rank: Field) {
  return rank.equals(RANKS.PAWN).not().and(rank.equals(RANKS.KING).not());
}

export type RankAsChar = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PromotionRankAsChar = 'r' | 'n' | 'b' | 'q';

export const rankToName = (rank: bigint | number) => {
  switch (BigInt(rank)) {
    case 0n:
      return 'PAWN';
    case 1n:
      return 'ROOK';
    case 2n:
      return 'KNIGHT';
    case 3n:
      return 'BISHOP';
    case 4n:
      return 'QUEEN';
    case 5n:
      return 'KING';
    default:
      throw new Error('Invalid rank');
  }
};
export const rankToChar = (rank: bigint | number) => {
  switch (BigInt(rank)) {
    case 0n:
      return 'p';
    case 1n:
      return 'r';
    case 2n:
      return 'n';
    case 3n:
      return 'b';
    case 4n:
      return 'q';
    case 5n:
      return 'k';
    default:
      throw new Error('Invalid rank');
  }
};
export const charToRank = (char: RankAsChar) => {
  switch (char) {
    case 'p':
      return RANKS.PAWN;
    case 'r':
      return RANKS.ROOK;
    case 'n':
      return RANKS.KNIGHT;
    case 'b':
      return RANKS.BISHOP;
    case 'q':
      return RANKS.QUEEN;
    case 'k':
      return RANKS.KING;
    default:
      throw new Error('Invalid rank');
  }
};
