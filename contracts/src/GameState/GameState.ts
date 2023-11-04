import { Field, Bool, Struct, UInt32 } from 'o1js';

import { Piece } from '../Piece/Piece';
import { Position } from '../Position/Position';
import { RANK, RankAsChar } from '../Piece/Rank';
import { pack, unpack } from '../Packer';
import { PlayerState } from './PlayerState/PlayerState';

export const defaultFEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * 162 + 162 + 1 + 1 + 3 + 7 + 1 = 336
 */
export class GameState extends Struct({
  white: PlayerState,
  black: PlayerState,
  turn: Bool,
  enpassant: Bool,
  column: Field,
  halfmove: Field,
  canDraw: Bool,
}) {
  static from(
    white: PlayerState,
    black: PlayerState,
    turn: Bool,
    enpassant: Bool,
    column: Field,
    halfmove: Field,
    canDraw: Bool
  ): GameState {
    return new GameState({
      white,
      black,
      turn,
      enpassant,
      column,
      halfmove,
      canDraw,
    });
  }
  /**
   *
   * @param state 162|162|1|1|3|7|1 = 336
   * @returns
   */
  static fromEncoded(fields: Field[]): GameState {
    const [
      whiteBits,
      blackBits,
      turnBit,
      enpassantBits,
      columnBits,
      halfmoveBits,
      canDrawBit,
    ] = unpack(fields, [162, 162, 1, 1, 3, 7, 1]);

    const white = PlayerState.fromEncoded([whiteBits]);
    const black = PlayerState.fromEncoded([blackBits]);
    const turn = Bool.fromFields([turnBit]);
    const enpassant = Bool.fromFields([enpassantBits]);
    const column = Field.fromFields([columnBits]);
    const halfmove = Field.fromFields([halfmoveBits]);
    const canDraw = Bool.fromFields([canDrawBit]);
    return GameState.from(
      white,
      black,
      turn,
      enpassant,
      column,
      halfmove,
      canDraw
    );
  }
  public encode(): Field[] {
    return pack(
      [
        ...this.white.encode(),
        ...this.black.encode(),
        ...this.turn.toFields(),
        ...this.enpassant.toFields(),
        ...this.column.toFields(),
        ...this.halfmove.toFields(),
        ...this.canDraw.toFields(),
      ],
      [162, 162, 1, 1, 3, 7, 1]
    );
  }
  static fromFEN(FEN: string = defaultFEN): GameState {
    let [pieces, turn, castling, enpassant, half, full] = FEN.split(' ');
    let white = {
      pieces: [] as Piece[],
      castling: {
        kingSide: Bool(castling.includes('K')),
        queenSide: Bool(castling.includes('Q')),
      },
    };
    let black = {
      pieces: [] as Piece[],
      castling: {
        kingSide: Bool(castling.includes('k')),
        queenSide: Bool(castling.includes('q')),
      },
    };
    pieces.split('/').forEach((row, x) => {
      //expande number to dots
      const expanded = row.replace(/[1-8]/g, (m) => '.'.repeat(Number(m)));
      const chars = expanded.split('');
      chars.forEach((char, y) => {
        if (char == '.') return;
        const position = Position.from(Field.from(x), Field.from(y));
        const captured = Bool(false);
        const rank = Field(RANK.from.char[char.toLowerCase() as RankAsChar]);
        const piece = Piece.from(position, captured, rank);
        char == char.toUpperCase()
          ? white.pieces.push(piece)
          : black.pieces.push(piece);
      });
    });
    const column = Math.max(0, enpassant.charCodeAt(0) - 97);
    return GameState.from(
      PlayerState.from(white.pieces, white.castling),
      PlayerState.from(black.pieces, black.castling),
      Bool(turn.includes('w')),
      Bool(enpassant !== '-'),
      Field(column),
      Field(Number(half)),
      Bool(false)
    );
  }
  public toString() {
    let pieces: string[][] = [];
    for (let i = 0; i < 8; i++) {
      pieces.push([]);
      for (let j = 0; j < 8; j++) {
        pieces[i].push('.');
      }
    }
    this.white.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const x = Number(p.position.x.toString());
        const y = Number(p.position.y.toString());
        pieces[x][y] = RANK.to.char(p.rank.toBigInt()).toUpperCase();
      }
    });
    this.black.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const x = Number(p.position.x.toString());
        const y = Number(p.position.y.toString());
        pieces[x][y] = RANK.to.char(p.rank.toBigInt()).toLowerCase();
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
}
