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


export class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  static from(x: number | Field, y: number | Field) {
    return new Position({ x: UInt32.from(x), y: UInt32.from(y) });
  }
  static fromEncoded(bits: Bool[]): Position {
    const x = Field.fromBits(bits.slice(0, 3));
    const y = Field.fromBits(bits.slice(3, 6));
    return Position.from(x, y);
  }
  public equals(position: Position): Bool {
    return this.x.equals(position.x).and(this.y.equals(position.y));
  }
  public set(position: Position) {
    this.x = position.x;
    this.y = position.y;
  }
}


const PieceType = {
  PAWN: Field(1 << 0),
  ROOK: Field(1 << 1),
  KNIGHT: Field(1 << 2),
  BISHOP: Field(1 << 3),
  QUEEN: Field(1 << 4),
  KING: Field(1 << 5),
};


class Piece extends Struct({
  position: Position,
  captured: Bool,
  rank: Field,
}) {
  static from(position: Position, captured: Bool, rank: Field) {
    return new Piece({ position, captured, rank });
  }
  canMoveTo(newPosition: Position): Bool {
    return Bool(true);
  }
  public encode(): Bool[] {
    //(6 bit position + 1 bit captured + 6 bits rank ) = 13 bits
    console.log("x", this.position.x.value.toBits(3));
    console.log("encoding", this.position.x.value.toBits(3).concat(this.position.y.value.toBits(3)).concat(this.captured).concat(this.rank.toBits(6)));
    return this.position.x.value.toBits(3).concat(this.position.y.value.toBits(3)).concat(this.captured).concat(this.rank.toBits(6));
  }
  static fromEncoded(bits: Bool[]): Piece {
    //(6 bit position + 1 bit captured + 6 bits rank) = 13 bits
    return Piece.from(Position.fromEncoded(bits.slice(0, 6)), bits[6], Field.fromBits(bits.slice(7, 13)));
  }
  public display() {
    console.log(`
    x:${this.position.x.value.toString()}\n
    y:${this.position.y.value.toString()}\n
    rank:${this.rank.value.toString()}`);
  }
}

class Board extends Struct({
  whitePieces: Provable.Array(Piece, 16),
  blackPieces: Provable.Array(Piece, 16),
}) {

  static from(whitePieces: Piece[], blackPieces: Piece[]): Board {
    return new Board({ whitePieces, blackPieces });
  }
  static fromEncoded(whitePieces: Field, blackPieces: Field): Board {
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
    const whitePiecesEncoded = Field.fromBits(this.blackPieces.flatMap((piece) => piece.encode()));
    const blackPiecesEncoded = Field.fromBits(this.blackPieces.flatMap((piece) => piece.encode()));
    return [whitePiecesEncoded, blackPiecesEncoded];
  }

  public contains(position: Position): Bool {
    return position.x.lessThan(UInt32.from(8)).and(position.y.lessThan(UInt32.from(8)));
  }
  public myPieces(turn: Bool[]): Piece[] {
    return Provable.switch(turn, Provable.Array(Piece, 16), [this.whitePieces, this.blackPieces]);
  }
  public oppPieces(turn: Bool[]): Piece[] {
    return Provable.switch(turn, Provable.Array(Piece, 16), [this.blackPieces, this.whitePieces]);
  }
  static startBoard() {
    const startingPositions = [
      "rnbqkbnr",
      "pppppppp",
      "........",
      "........",
      "........",
      "........",
      "PPPPPPPP",
      "RNBQKBNR",
    ];
    let whitePieces: Bool[] = [];
    let blackPieces: Bool[] = [];
    startingPositions.forEach((row, y) => {
      row.split('').forEach((ch, x) => {
        if (ch !== '.') {
          const position = Position.from(x, y);
          const captured = Bool(false);
          let rank = Field.from(1);
          switch (ch.toUpperCase()) {
            case "P": rank = PieceType.PAWN; break;
            case "R": rank = PieceType.ROOK; break;
            case "N": rank = PieceType.KNIGHT; break;
            case "B": rank = PieceType.BISHOP; break;
            case "Q": rank = PieceType.QUEEN; break;
            case "K": rank = PieceType.KING; break;
          }
          ch.match(/[A-Z]/) ?
          whitePieces.push(...Piece.from(position, captured, rank).encode()):
          blackPieces.push(...Piece.from(position, captured, rank).encode());
        }
      });
    });
    console.log("white", whitePieces);
    console.log("black", blackPieces);
    return Board.fromEncoded(Field.fromBits(whitePieces), Field.fromBits(blackPieces));
  }
  public display() {
    this.whitePieces.forEach((piece) => {
      piece.display();
    });
    this.blackPieces.forEach((piece) => {
      piece.display();
    });
  }
}


class ChessGame extends SmartContract {
  @state(Field) whitePieces = State<Field>();
  @state(Field) blackPieces = State<Field>();
  @state(UInt32) turn = State<UInt32>();
  @state(PublicKey) whiteKey = State<PublicKey>();
  @state(PublicKey) blackKey = State<PublicKey>();
  @method init() {
    super.init();
  }

  @method startGame(whiteKey: PublicKey, blackKey: PublicKey) {
    this.turn.set(UInt32.from(1));
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
    const board = Board.startBoard();
    let [a, b] = board.encode();
    this.whitePieces.set(a);
    this.blackPieces.set(b);
  }

  @method move(id: UInt32, newPosition: Position) {
    const turnMask = this.turn.getAndAssertEquals().value.toBits(2);
    const board = Board.fromEncoded(this.whitePieces.getAndAssertEquals(), this.blackPieces.getAndAssertEquals());
    const myPiece = Provable.switch(id.value.toBits(16), Piece, board.myPieces(turnMask));

    //verify:
    //piece should not be captured
    myPiece.captured.assertFalse("piece is captured");
    //piece does not move out of the board
    board.contains(newPosition).assertTrue("piece cannot move out of the board");

    //piece can move to new position
    myPiece.canMoveTo(newPosition).assertTrue("piece cannot move to the new position");
    //piece does not capture own piece
    board.myPieces(this.turn.get().value.toBits(2)).forEach((piece) => {
      piece.position.equals(newPosition).assertFalse();
    }, 'piece cannot capture own piece');
    //piece does not pass through other pieces

    //move does not put own king in check

    //update board
    myPiece.position.set(newPosition);
    let [a, b] = board.encode();
    this.whitePieces.set(a);
    this.blackPieces.set(b);
    this.turn.set(Provable.switch(turnMask, UInt32, [UInt32.from(1), UInt32.from(2)]));
  }
  getBoard(): Board {
    return Board.fromEncoded(this.whitePieces.get(), this.blackPieces.get());
  }
}
