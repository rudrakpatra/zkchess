import { Field, Bool, Struct, Provable } from 'o1js';
import { Piece } from '../Piece/Piece.js';
import { pack, unpack } from '../Packer.js';
import { Position } from '../Position/Position.js';
import { RANKS } from '../Piece/Rank.js';

/**
 * 16*10 bits + 2 bits = 162 bits
 */
export class PlayerState extends Struct({
  pieces: Provable.Array(Piece, 16),
  castling: {
    kingSide: Bool,
    queenSide: Bool,
  },
}) {
  static from(
    pieces: Piece[],
    castling: { kingSide: Bool; queenSide: Bool }
  ): PlayerState {
    return new PlayerState({ pieces, castling });
  }
  static ENCODING_SCHEME = [160, 1, 1];
  /**
   *
   * @param field 160|1|1 = 162
   * @returns
   */
  static fromEncoded(fields: Field[]): PlayerState {
    const [piecesBits, kingSideCastlingBit, queenSideCastlingBit] = unpack(
      fields,
      PlayerState.ENCODING_SCHEME
    );
    const pieces = unpack([piecesBits], Array(16).fill(10)).map((f) =>
      Piece.fromEncoded([f])
    );
    const castling = {
      kingSide: Bool.fromFields([kingSideCastlingBit]),
      queenSide: Bool.fromFields([queenSideCastlingBit]),
    };
    return PlayerState.from(pieces, castling);
  }
  public encode(): Field[] {
    return pack(
      [
        ...pack(
          this.pieces.flatMap((p) => p.encode()),
          Array(16).fill(10)
        ),
        this.castling.kingSide.toField(),
        this.castling.queenSide.toField(),
      ],
      PlayerState.ENCODING_SCHEME
    );
  }
  public toFields(): Field[] {
    return this.encode();
  }

  public isUncapturedPieceAt(position: Position): Bool {
    return this.pieces
      .map((p) => p.captured.not().and(p.position.equals(position)))
      .reduce(Bool.or);
  }
  public getKing(): Piece {
    return this.pieces.reduce(
      (p, n) => Provable.if(n.rank.equals(RANKS.KING), n, p),
      this.pieces[0]
    );
  }
  public checkAndGetUncapturedPieceAt(position: Position): Piece {
    this.isUncapturedPieceAt(position).assertTrue('no piece at position');
    return this.pieces.reduce(
      (p, n) => Provable.if(n.position.equals(position), n, p),
      this.pieces[0]
    );
  }
}
