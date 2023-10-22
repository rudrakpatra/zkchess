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

export { Board, ChessGame };

const PieceType=  {
  King: UInt32.from(0),
  Queen: UInt32.from(1),
  Bishop: UInt32.from(2),
  Knight: UInt32.from(3),
  Rook: UInt32.from(4),
  Pawn: UInt32.from(5),
}
class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  static from(x: number, y: number) {
    return new Position({ x: UInt32.from(x), y: UInt32.from(y) });
  }
  public set(position: Position) {
    this.x=position.x;
    this.y=position.y;
  }
}
class Piece extends Struct({
  position: Position,
  captured: Bool,
  type: UInt32,
}) {
  static from(position: Position, captured: Bool, type: UInt32) {
    return new Piece({ position, captured, type });
  }
  public toFields(): [Field] {
    // TODO later
    //(6 bit position + 1 bit captured + 6 bits piece type) = 13 bits
    return [Field(0)]; // TODO
  }
  static fromEncoded(value: Field): Piece {
    // TODO later
    //(6 bit position + 1 bit captured + 6 bits piece type) = 13 bits
    return Piece.from(Position.from(0, 0), Bool(false),PieceType.Pawn);
  }
}

class Board extends Struct({
  whitePieces: Provable.Array(Piece, 16),
  blackPieces: Provable.Array(Piece, 16),
}) {
  static fromEncoded(whitePieces: Field, blackPieces: Field): Board {
    // TODO later
    return Board.startBoard();
  }
  public encode(): [Field, Field] {
    //for White and Black
    //unit# to position 16 pieces * 13(Piece) = 16*13 = 208 bits for each player
    return [Field(0), Field(0)]; // TODO
  }
  static startBoard() {
    return Board.fromEncoded(Field(0), Field(0));
  }

}


class ChessGame extends SmartContract {
  @state(Field) whitePieces = State<Field>();
  @state(Field) blackPieces = State<Field>();
  @state(Bool) whitesMove = State<Bool>();
  @state(PublicKey) whiteKey = State<PublicKey>();
  @state(PublicKey) blackKey = State<PublicKey>();
  @method init() {
    super.init();
  }

  @method startGame(whiteKey: PublicKey, blackKey: PublicKey) {
    this.whitesMove.set(Bool(true));
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
  }

  @method move(id:number,newPosition: Position) {
    const board= Board.fromEncoded(this.whitePieces.getAndAssertEquals(), this.blackPieces.getAndAssertEquals());
    const piece=Provable.if(this.whitesMove.getAndAssertEquals(),board.whitePieces[id],board.blackPieces[id]);
    piece.captured.assertFalse();
    //verify:
    //1.piece does not capture own piece
    //2.piece does pass through other pieces
    //3.move does not put own king in check

    //update board
    piece.position.set(newPosition);
    let [a,b]=board.encode();
    this.whitePieces.set(a);
    this.blackPieces.set(b);
    this.whitesMove.set(this.whitesMove.get().not());
  }

  @method moveKnight(newPosition: Position) {

  }
  @method moveBishop(nextPieces: Pieces, position: Position, newPosition: Position) { }
  @method moveRook(nextPieces: Pieces, position: Position, newPosition: Position) { }
  @method moveQueen(nextBoard: Board, position: Position, newPosition: Position) { }
  @method movePawn(nextBoard: Board, position: Position, newPosition: Position) { }
}
