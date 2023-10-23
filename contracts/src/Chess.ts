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


class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  static from(x: number, y: number) {
    return new Position({ x: UInt32.from(x), y: UInt32.from(y) });
  }
  public equals(position: Position): Bool {
    return this.x.equals(position.x).and(this.y.equals(position.y));
  }
  public set(position: Position) {
    this.x=position.x;
    this.y=position.y;
  }
}


const PieceType = {
  PAWN: Field(1<<0),
  ROOK: Field(1<<1),
  KNIGHT: Field(1<<2),
  BISHOP: Field(1<<3),
  QUEEN: Field(1<<4),
  KING: Field(1<<5),
};

class Piece extends Struct({
  position: Position,
  captured: Bool,
  type:Field,
}) {
  static from(position: Position, captured: Bool, type:Field) {
    return new Piece({ position, captured,type });
  }
  canMoveTo(newPosition: Position): Bool {
    // TODO later
    return Bool(true);
  }
  public toFields(): [Field] {
    // TODO later
    //(6 bit position + 1 bit captured + 6 bits piece type) = 13 bits
    return [Field(0)]; // TODO
  }
  static fromEncoded(value: Field): Piece {
    // TODO later
    //(6 bit position + 1 bit captured + 6 bits piece type) = 13 bits
    return Piece.from(Position.from(0, 0), Bool(false), PieceType.PAWN);
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
  public contains(position: Position): Bool {
    // TODO later
    return position.x.lessThan(new UInt32(8)).and(position.y.lessThan(new UInt32(8)));
  }
  public myPieces(turn:Bool[]): Piece[] {
    // TODO later
    return Provable.switch(turn, Provable.Array(Piece,16), [this.whitePieces, this.blackPieces]);
  }
  public oppPieces(turn:Bool[]): Piece[] {
    // TODO later
    return Provable.switch(turn, Provable.Array(Piece,16), [this.blackPieces, this.whitePieces]);
  }
  public encode(): [Field, Field] {
    //for self and opp
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
  @state(Bool) turn = State<Bool[]>();
  @state(PublicKey) whiteKey = State<PublicKey>();
  @state(PublicKey) blackKey = State<PublicKey>();
  @method init() {
    super.init();
  }

  @method startGame(whiteKey: PublicKey, blackKey: PublicKey) {
    this.turn.set([Bool(true), Bool(false)]);
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
  }

  @method move(id:number,newPosition: Position) {
    const board=Board.fromEncoded(this.whitePieces.getAndAssertEquals(),this.blackPieces.getAndAssertEquals());
    const myPiece=board.myPieces(this.turn.get())[id];
    //verify:
    //piece should not be captured
    myPiece.captured.assertFalse("piece is captured");
    //piece does not move out of the board
    board.contains(newPosition).assertTrue("piece moves out of the board");
    
    //piece can move to new position
    myPiece.canMoveTo(newPosition).assertTrue("piece cannot move to the new position");
    //piece does not capture own piece
    board.myPieces(this.turn.get()).forEach((piece) => {
      piece.position.equals(newPosition).assertFalse();
    }, 'piece cannot capture own piece');
    //piece does not pass through other pieces
    Provable.switch([Bool()], Field,[PieceType.PAWN]);
    //3.move does not put own king in check

    //update board
    myPiece.position.set(newPosition);
    let [a,b]=board.encode();
    this.whitePieces.set(a);
    this.blackPieces.set(b);
    this.turn.set([this.turn.get()[1],this.turn.get()[0]]);
  }
}
