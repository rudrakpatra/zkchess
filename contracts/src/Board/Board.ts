import {
  Field,
  SmartContract,
  method,
  Bool,
  state,
  State,
  Poseidon,
  Struct,
  Provable,
  PublicKey,
  UInt32,
} from 'o1js';

import { Piece, RANKS } from './Piece/Piece';
import { Position } from './Position/Position';

export const startingPositions = [
  'rnbqkbnr', //0
  'pppppppp', //1
  '........',
  '........',
  '........',
  '........',
  'PPPPPPPP',
  'RNBQKBNR', //7
];

const FieldFromChar = (ch: string) => {
  switch (ch) {
    case 'P':
      return Field(RANKS.PAWN);
    case 'R':
      return Field(RANKS.ROOK);
    case 'N':
      return Field(RANKS.KNIGHT);
    case 'B':
      return Field(RANKS.BISHOP);
    case 'Q':
      return Field(RANKS.QUEEN);
    case 'K':
      return Field(RANKS.KING);
    default:
      return Field(0n);
  }
};
const charFromName = (name: string) => {
  switch (name) {
    case 'PAWN':
      return 'P';
    case 'ROOK':
      return 'R';
    case 'KNIGHT':
      return 'N';
    case 'BISHOP':
      return 'B';
    case 'QUEEN':
      return 'Q';
    case 'KING':
      return 'K';
    default:
      return '.';
  }
};

export class Board extends Struct({
  whitePieces: Provable.Array(Piece, 16),
  blackPieces: Provable.Array(Piece, 16),
}) {
  static from(whitePieces: Piece[], blackPieces: Piece[]): Board {
    return new Board({ whitePieces, blackPieces });
  }
  static fromEncoded(pieces: Field[]): Board {
    const [whitePieces, blackPieces] = pieces;
    const stream = whitePieces.toBits(208);
    let whitePiecesDecoded: Piece[] = [];
    for (let i = 0; i < 16; i++) {
      let piece = Piece.fromEncoded(stream.slice(i * 13, (i + 1) * 13));
      whitePiecesDecoded.push(piece);
    }
    const stream2 = blackPieces.toBits(208);
    let blackPiecesDecoded: Piece[] = [];
    for (let i = 0; i < 16; i++) {
      let piece = Piece.fromEncoded(stream2.slice(i * 13, (i + 1) * 13));
      blackPiecesDecoded.push(piece);
    }
    return Board.from(whitePiecesDecoded, blackPiecesDecoded);
  }
  public encode(): [Field, Field] {
    const whitePiecesEncoded = Field.fromBits(
      this.whitePieces.flatMap((piece) => piece.encode())
    );
    const blackPiecesEncoded = Field.fromBits(
      this.blackPieces.flatMap((piece) => piece.encode())
    );
    return [whitePiecesEncoded, blackPiecesEncoded];
  }
  public contains(position: Position): Bool {
    return position.x
      .greaterThanOrEqual(Field.from(0))
      .and(position.x.lessThan(Field.from(8)))
      .and(position.y.greaterThanOrEqual(Field.from(0)))
      .and(position.y.lessThan(Field.from(8)));
  }
  static startBoard(position: string[] = startingPositions): Board {
    let whitePieces: Piece[] = [];
    let blackPieces: Piece[] = [];
    (position || startingPositions).forEach((row, x) => {
      row.split('').forEach((ch, y) => {
        if (ch !== '.') {
          const position = Position.from(x, y);
          const captured = Bool(false);
          const rank = FieldFromChar(ch.toUpperCase());
          const piece = Piece.from(position, captured, rank);
          if (ch.match(/[A-Z]/)) {
            whitePieces.push(piece);
          } else {
            blackPieces.push(piece);
          }
        }
      });
    });
    return Board.from(whitePieces, blackPieces);
  }
  public display() {
    let grid: string[][] = [];
    for (let i = 0; i < 8; i++) {
      grid.push([]);
      for (let j = 0; j < 8; j++) {
        grid[i].push('.');
      }
    }
    this.whitePieces.forEach((piece) => {
      const str = piece.toString();
      if (str[2] == '+')
        grid[Number(str[0])][Number(str[1])] = charFromName(
          str.substring(3)
        ).toUpperCase();
    });
    this.blackPieces.forEach((piece) => {
      const str = piece.toString();
      if (str[2] == '+')
        grid[Number(str[0])][Number(str[1])] = charFromName(
          str.substring(3)
        ).toLowerCase();
    });
    return grid.map((row) => row.join(''));
  }
}
