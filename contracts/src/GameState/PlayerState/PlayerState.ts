import { Field, Bool, Struct, Provable } from 'o1js';
import { Piece } from '../../Piece/Piece';
import { pack, unpack } from '../../Packer';

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
  /**
   *
   * @param field 160|1|1 = 162
   * @returns
   */
  static fromEncoded(fields: Field[]): PlayerState {
    const [piecesBits, kingSideCastlingBit, queenSideCastlingBit] = unpack(
      fields,
      [160, 1, 1]
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
      [160, 1, 1]
    );
  }
  public toFields(): Field[] {
    return this.encode();
  }
}
