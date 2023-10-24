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
    const board = Board.fromEncoded(
      this.whitePieces.getAndAssertEquals(),
      this.blackPieces.getAndAssertEquals()
    );
    const myPiece = Provable.switch(
      id.value.toBits(16),
      Piece,
      board.myPieces(turnMask)
    );

    //verify:
    //piece should not be captured
    myPiece.captured.assertFalse('piece is captured');
    //piece does not move out of the board
    board
      .contains(newPosition)
      .assertTrue('piece cannot move out of the board');

    //piece can move to new position
    myPiece
      .canMoveTo(newPosition)
      .assertTrue('piece cannot move to the new position');
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
    this.turn.set(
      Provable.switch(turnMask, UInt32, [UInt32.from(1), UInt32.from(2)])
    );
  }
  getBoard(): Board {
    return Board.fromEncoded(this.whitePieces.get(), this.blackPieces.get());
  }
}
