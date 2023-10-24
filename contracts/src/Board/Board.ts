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

import { Piece, MaskFromName } from './Piece/Piece';
import { Position } from './Position/Position';

export const startingPositions = [
  'rnbqkbnr',
  'pppppppp',
  '........',
  '........',
  '........',
  '........',
  'PPPPPPPP',
  'RNBQKBNR',
];

const FieldFromChar = (ch: string) => {
  switch (ch) {
    case 'P':
      return Field.fromBits(MaskFromName.PAWN);
    case 'R':
      return Field.fromBits(MaskFromName.ROOK);
    case 'N':
      return Field.fromBits(MaskFromName.KNIGHT);
    case 'B':
      return Field.fromBits(MaskFromName.BISHOP);
    case 'Q':
      return Field.fromBits(MaskFromName.QUEEN);
    case 'K':
      return Field.fromBits(MaskFromName.KING);
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
      let piece = Piece.fromEncoded(
        stream.slice(i * 13, (i + 1) * 13).map((x) => x.toString() === 'true')
      );
      whitePiecesDecoded.push(piece);
    }
    const stream2 = blackPieces.toBits(208);
    let blackPiecesDecoded: Piece[] = [];
    for (let i = 0; i < 16; i++) {
      let piece = Piece.fromEncoded(
        stream2.slice(i * 13, (i + 1) * 13).map((x) => x.toString() === 'true')
      );
      blackPiecesDecoded.push(piece);
    }
    return Board.from(whitePiecesDecoded, blackPiecesDecoded);
  }
  public encode(): [Field, Field] {
    const whitePiecesEncoded = Field.fromBits(
      this.blackPieces.flatMap((piece) => piece.encode())
    );
    const blackPiecesEncoded = Field.fromBits(
      this.blackPieces.flatMap((piece) => piece.encode())
    );
    return [whitePiecesEncoded, blackPiecesEncoded];
  }
  public contains(position: Position): Bool {
    return position.x
      .lessThan(UInt32.from(8))
      .and(position.y.lessThan(UInt32.from(8)));
  }
  public myPieces(turn: Bool[]): Piece[] {
    return Provable.switch(turn, Provable.Array(Piece, 16), [
      this.whitePieces,
      this.blackPieces,
    ]);
  }
  public oppPieces(turn: Bool[]): Piece[] {
    return Provable.switch(turn, Provable.Array(Piece, 16), [
      this.blackPieces,
      this.whitePieces,
    ]);
  }
  static startBoard(position: string[] = startingPositions): Board {
    let whitePieces: Piece[] = [];
    let blackPieces: Piece[] = [];
    (position || startingPositions).forEach((row, y) => {
      row.split('').forEach((ch, x) => {
        if (ch !== '.') {
          const position = Position.from(x, y);
          const captured = Bool(false);
          const rank = FieldFromChar(ch.toUpperCase());
          ch.match(/[A-Z]/)
            ? whitePieces.push(Piece.from(position, captured, rank))
            : blackPieces.push(Piece.from(position, captured, rank));
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
        grid[Number(str[1])][Number(str[0])] = charFromName(
          str.substring(3)
        ).toUpperCase();
    });
    this.blackPieces.forEach((piece) => {
      const str = piece.toString();
      if (str[2] == '+')
        grid[Number(str[1])][Number(str[0])] = charFromName(
          str.substring(3)
        ).toLowerCase();
    });
    return grid.map((row) => row.join(''));
  }
}
