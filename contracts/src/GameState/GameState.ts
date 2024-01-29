import { Field, Bool, Struct, Provable } from 'o1js';

import { Piece } from '../Piece/Piece.js';
import { Position } from '../Position/Position.js';
import { RankAsChar, charToRank, rankToChar } from '../Piece/Rank.js';
import { pack, unpack } from '../Packer.js';
import { PlayerState } from '../PlayerState/PlayerState.js';

export const defaultFEN = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`;
export enum GameResult {
  ONGOING,
  ONGOING_OFFERED_DRAW,
  ONGOING_AND_STALEMATE_CLAIMED,
  STALEMATE_CLAIM_REPORTED,
  WHITE_WINS,
  BLACK_WINS,
  DRAW,
  DRAW_BY_STALEMATE,
}
export class GameState extends Struct({
  white: PlayerState,
  black: PlayerState,
  turn: Bool,
  enpassant: Bool,
  kingCastled: Bool,
  column: Field,
  halfmove: Field,
  canDraw: Bool,
  result: Field,
}) {
  static from(
    white: PlayerState,
    black: PlayerState,
    turn: Bool,
    enpassant: Bool,
    kingCastled: Bool,
    column: Field,
    halfmove: Field,
    canDraw: Bool,
    result: Field
  ): GameState {
    return new GameState({
      white,
      black,
      turn,
      enpassant,
      kingCastled,
      column,
      halfmove,
      canDraw,
      result,
    });
  }
  static ENCODING_SCHEME = [162, 162, 1, 1, 1, 3, 8, 1, 3];
  /**
   *
   * @param state 162|162|1|1|1|3|8|3 = 341 bits
   * @returns
   */
  static fromEncoded(fields: Field[]): GameState {
    const [
      whiteBits,
      blackBits,
      turnBit,
      enpassantBits,
      kingCastledBits,
      columnBits,
      halfmoveBits,
      canDrawBit,
      resultBits,
    ] = unpack(fields, GameState.ENCODING_SCHEME);

    const white = PlayerState.fromEncoded([whiteBits]);
    const black = PlayerState.fromEncoded([blackBits]);
    const turn = Bool.fromFields([turnBit]);
    const enpassant = Bool.fromFields([enpassantBits]);
    const kingCastled = Bool.fromFields([kingCastledBits]);
    const column = Field.fromFields([columnBits]);
    const halfmove = Field.fromFields([halfmoveBits]);
    const canDraw = Bool.fromFields([canDrawBit]);
    const result = Field.fromFields([resultBits]);
    return GameState.from(
      white,
      black,
      turn,
      enpassant,
      kingCastled,
      column,
      halfmove,
      canDraw,
      result
    );
  }
  public toFields(): Field[] {
    return this.encode();
  }
  public encode(): Field[] {
    return pack(
      [
        ...this.white.encode(),
        ...this.black.encode(),
        ...this.turn.toFields(),
        ...this.enpassant.toFields(),
        ...this.kingCastled.toFields(),
        ...this.column.toFields(),
        ...this.halfmove.toFields(),
        ...this.canDraw.toFields(),
        ...this.result.toFields(),
      ],
      GameState.ENCODING_SCHEME
    );
  }
  /**
   * @param FEN
   * @returns
   */
  static fromFEN(FEN: string = defaultFEN): GameState {
    let [pieces, turn, castling, enpassant, half, full] = FEN.split(' ');
    let piece0 = Piece.from(
      Position.from(Field.from(0), Field.from(0)),
      Bool(true), //captured
      Field.from(0)
    );
    let white = {
      pieces: Array.from({ length: 16 }, () => piece0),
      castling: {
        kingSide: Bool(castling.includes('K')),
        queenSide: Bool(castling.includes('Q')),
      },
    };
    let black = {
      pieces: Array.from({ length: 16 }, () => piece0),
      castling: {
        kingSide: Bool(castling.includes('k')),
        queenSide: Bool(castling.includes('q')),
      },
    };

    let whitePieceNumber = 0;
    let blackPieceNumber = 0;
    pieces.split('/').forEach((row, x) => {
      //expande number to dots
      const expanded = row.replace(/[1-8]/g, (m) => '.'.repeat(Number(m)));
      const chars = expanded.split('');
      chars.forEach((char, y) => {
        if (char == '.') return;
        const position = Position.from(Field.from(x), Field.from(y));
        const captured = Bool(false);
        const rank = Field(charToRank(char.toLowerCase() as RankAsChar));
        const piece = Piece.from(position, captured, rank);
        char == char.toUpperCase()
          ? (white.pieces[whitePieceNumber++] = piece)
          : (black.pieces[blackPieceNumber++] = piece);
      });
    });
    const column = Math.max(0, enpassant.charCodeAt(0) - 97);
    return GameState.from(
      PlayerState.from(white.pieces, white.castling), //playerState - white
      PlayerState.from(black.pieces, black.castling), //playerState - black
      Bool(turn.includes('w')), //turn
      Bool(enpassant !== '-'), //enpassant
      Bool(false), //kingCastled
      Field(column), //column
      Field(Number(half)), //halfmove
      Bool(false), //canDraw
      Field(GameResult.ONGOING) //result
    );
  }
  public toFEN() {
    let pieces: string[][] = [];
    for (let i = 0; i < 8; i++) {
      pieces.push([]);
      for (let j = 0; j < 8; j++) {
        pieces[i].push('.');
      }
    }
    this.white.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const x = Number(p.position.row.toString());
        const y = Number(p.position.column.toString());
        pieces[x][y] = rankToChar(p.rank.toBigInt()).toUpperCase();
      }
    });
    this.black.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const x = Number(p.position.row.toString());
        const y = Number(p.position.column.toString());
        pieces[x][y] = rankToChar(p.rank.toBigInt()).toLowerCase();
      }
    });
    const board = pieces
      .map((row) => row.join('').replace(/\.+/g, (m) => m.length.toString()))
      .join('/');

    const turn = this.turn.toString() === 'true' ? 'w' : 'b';
    const castling =
      '' +
      (this.white.castling.kingSide.toString() === 'true' ? 'K' : '') +
      (this.white.castling.queenSide.toString() === 'true' ? 'Q' : '') +
      (this.black.castling.kingSide.toString() === 'true' ? 'k' : '') +
      (this.black.castling.queenSide.toString() === 'true' ? 'q' : '');
    //enpassant
    const enpassantVal =
      String.fromCharCode(Number(this.column.toString()) + 97) +
      (turn === 'w' ? 6 : 3);
    const enpassant = this.enpassant.toString() === 'true' ? enpassantVal : '-';

    const halfmove = this.halfmove.toString();
    return `${board} ${turn} ${castling} ${enpassant} ${halfmove} 1`;
  }
  public toAscii() {
    const grid: string[][] = [];
    for (let i = 0; i < 8; i++) {
      grid.push([]);
      for (let j = 0; j < 8; j++) {
        grid[i].push('.');
      }
    }
    this.white.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const x = Number(p.position.row.toString());
        const y = Number(p.position.column.toString());
        grid[x][y] = rankToChar(p.rank.toBigInt()).toUpperCase();
      }
    });
    this.black.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const x = Number(p.position.row.toString());
        const y = Number(p.position.column.toString());
        grid[x][y] = rankToChar(p.rank.toBigInt()).toLowerCase();
      }
    });
    const board = grid.map((row) => row.join(' ')).join('\n');

    return board;
  }
  public self() {
    return Provable.if(this.turn, this.white, this.black);
  }
  public opponent() {
    return Provable.if(this.turn, this.black, this.white);
  }
  public isUncapturedPieceAt(position: Position) {
    return this.white
      .isUncapturedPieceAt(position)
      .or(this.black.isUncapturedPieceAt(position));
  }
}
