export type RankAsName =
  | 'PAWN'
  | 'ROOK'
  | 'KNIGHT'
  | 'BISHOP'
  | 'QUEEN'
  | 'KING';
export type RankAsChar = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PromotionRankAsChar = 'r' | 'n' | 'b' | 'q';
export const RANK = {
  from: {
    name: {
      PAWN: 0,
      ROOK: 1,
      KNIGHT: 2,
      BISHOP: 3,
      QUEEN: 4,
      KING: 5,
    },
    char: {
      p: 0,
      r: 1,
      n: 2,
      b: 3,
      q: 4,
      k: 5,
    },
  },
  to: {
    name: (rank: bigint) => {
      switch (rank) {
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
    },
    char: (rank: bigint) => {
      switch (rank) {
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
    },
  },
};
