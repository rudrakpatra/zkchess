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
  UInt32
} from 'o1js';

export { Board, ChessGame };

const Piece = {
  BlackPawn: Field(0),
  WhitePawn: Field(1),
  BlackKnight: Field(2),
  WhiteKnight: Field(3),
  BlackBishop: Field(4),
  WhiteBishop: Field(5),
  BlackRook: Field(6),
  WhiteRook: Field(7),
  BlackQueen: Field(8),
  WhiteQueen: Field(9),
  BlackKing: Field(10),
  WhiteKing: Field(11),
  Empty: Field(12),
}

class Board extends Struct({
  value: Provable.Array(Provable.Array(Field, 8), 8),
}) {
  static fromEncoded(part0: Field, part1:Field ): Board {
    // TODO later
    return Board.startBoard();
  }
  public encode(): [Field, Field] {
    return [this.value[0][0], this.value[0][1]]; // TODO
  }
  static from(value: Field[][] ): Board {
    return new Board({ value });
  }
  static startBoard() {
    return this.from([
      [Piece.BlackRook, Piece.BlackKnight, Piece.BlackBishop, Piece.BlackQueen, Piece.BlackKing, Piece.BlackBishop, Piece.BlackKnight, Piece.BlackRook],
      [Piece.BlackPawn, Piece.BlackPawn, Piece.BlackPawn, Piece.BlackPawn, Piece.BlackPawn, Piece.BlackPawn, Piece.BlackPawn, Piece.BlackPawn],
      [Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty],
      [Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty],
      [Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty],
      [Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty, Piece.Empty],
      [Piece.WhitePawn, Piece.WhitePawn, Piece.WhitePawn, Piece.WhitePawn, Piece.WhitePawn, Piece.WhitePawn, Piece.WhitePawn, Piece.WhitePawn],
      [Piece.WhiteRook, Piece.WhiteKnight, Piece.WhiteBishop, Piece.WhiteQueen, Piece.WhiteKing, Piece.WhiteBishop, Piece.WhiteKnight, Piece.WhiteRook],
    ]);
  }
}

class Position extends Struct({
  x: UInt32,
  y: UInt32,
}) {
  static from(x: number, y:number) {
    return new Position({ x: UInt32.from(x), y: UInt32.from(y) });
  }
}

class ChessGame extends SmartContract {
  @state(Field) boardState0 = State<Field>();
  @state(Field) boardState1 = State<Field>();
  @state(Bool) whitesMove = State<Bool>();
  @state(PublicKey) white = State<PublicKey>();
  @state(PublicKey) black = State<PublicKey>();

  @method init() {
    super.init();
  }

  @method startGame(white:PublicKey, black:PublicKey) {
    this.whitesMove.set(Bool(true));
    this.white.set(white);
    this.black.set(black);
  }

  @method moveKing(nextBoard: Board, position:Position, nexPosition:Position) {
    nexPosition.x.assertLessThan(UInt32.from(8));
    nexPosition.y.assertLessThan(UInt32.from(8));
    const boardState0 = this.boardState0.getAndAssertEquals();
    const boardState1 = this.boardState1.getAndAssertEquals();
    const board = Board.fromEncoded(boardState0, boardState1);
    let piece = board.value[Number(position.x.toBigint())][Number(position.y.toBigint())];
    Provable.if(this.whitesMove.get(), piece.equals(Piece.WhiteKing), piece.equals(Piece.BlackKing)).assertTrue('not your turn');

    let diffX = Provable.if(position.x.lessThan(nexPosition.x), nexPosition.x.sub(position.x), position.x.sub(nexPosition.x));
    let diffY = Provable.if(position.y.lessThan(nexPosition.y), nexPosition.y.sub(position.y), position.y.sub(nexPosition.y));
    // (diffX + diffY) should be 1 or 2
    (diffX.add(diffY)).equals(UInt32.from(1))
    .or((diffX.add(diffY)).equals(UInt32.from(2)))
    .assertTrue('invalid move');
  }

  @method moveKnight(nextBoard: Board, position:Position, nexPosition:Position) {}
  @method moveBishop(nextBoard: Board, position:Position, nexPosition:Position) {}
  @method moveRook(nextBoard: Board, position:Position, nexPosition:Position) {}
  @method moveQueen(nextBoard: Board, position:Position, nexPosition:Position) {}
  @method movePawn(nextBoard: Board, position:Position, nexPosition:Position) {}
}
