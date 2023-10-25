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

import { Position } from './Board/Position/Position';
import { Board } from './Board/Board';
import { Piece } from './Board/Piece/Piece';

export { ChessGame };

class ChessGame extends SmartContract {
  @state(Field) whitePieces = State<Field>();
  @state(Field) blackPieces = State<Field>();
  @state(Bool) whiteToPlay = State<Bool>();
  @state(PublicKey) whiteKey = State<PublicKey>();
  @state(PublicKey) blackKey = State<PublicKey>();

  @method init() {
    super.init();
  }

  @method startGame(whiteKey: PublicKey, blackKey: PublicKey) {
    this.whiteToPlay.set(Bool(true));
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
    const board = Board.startBoard();
    let [a, b] = board.encode();
    this.whitePieces.set(a);
    this.blackPieces.set(b);
  }

  @method move(id: UInt32, newPosition: Position) {
    const whiteToPlay = this.whiteToPlay.getAndAssertEquals();
    const whitePieces = this.whitePieces.getAndAssertEquals();
    const blackPieces = this.blackPieces.getAndAssertEquals();
    const piecesArray = [whitePieces, blackPieces];
    const board = Board.fromEncoded(piecesArray);

    const myPieces = Provable.switch(
      [whiteToPlay, whiteToPlay.not()],
      Provable.Array(Piece, 16),
      [board.whitePieces, board.blackPieces]
    );
    const oppPieces = Provable.switch(
      [whiteToPlay.not(), whiteToPlay],
      Provable.Array(Piece, 16),
      [board.whitePieces, board.blackPieces]
    );

    //find my piece
    const myPiece = [...Array(16).keys()]
      .map((i) => UInt32.from(i))
      .reduce(
        (acc, u, i) => Provable.if(id.equals(u), myPieces[i], acc),
        Piece.from(Position.from(0, 0), Bool(false), Field.from(0))
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
    // piece does not capture own piece
    myPieces.forEach((piece) => {
      piece.position.equals(newPosition).assertFalse();
    }, 'piece cannot capture own piece');
    //piece does not pass through other pieces

    //move does not put own king in check

    //update board
    [...Array(16).keys()]
      .map((i) => UInt32.from(i))
      .forEach((u, i) => {
        board.whitePieces[i].position.set(
          Provable.if(id.equals(u), newPosition, board.whitePieces[i].position)
        );
      });
    //update the state
    let [a, b] = board.encode();
    this.whitePieces.set(a);
    this.blackPieces.set(b);
    this.whiteToPlay.set(whiteToPlay.not());
  }
  getBoard(): Board {
    const pieces = [this.whitePieces.get(), this.blackPieces.get()];
    return Board.fromEncoded(pieces);
  }
}
