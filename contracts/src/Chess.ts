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
import { Piece, RANKS } from './Board/Piece/Piece';

export { ChessGame };

export class Path extends Struct({
  positions: Provable.Array(Position, 8),
}) {
  static from(path: Position[]) {
    return new Path({ positions: path });
  }
}

class ChessGame extends SmartContract {
  @state(Field) whitePieces = State<Field>();
  @state(Field) blackPieces = State<Field>();
  @state(Bool) whiteToPlay = State<Bool>();
  @state(PublicKey) whiteKey = State<PublicKey>();
  @state(PublicKey) blackKey = State<PublicKey>();

  @method init() {
    super.init();
  }

  @method start(whiteKey: PublicKey, blackKey: PublicKey) {
    this.whiteToPlay.set(Bool(true));
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
    const board = Board.startBoard();
    let [a, b] = board.encode();
    this.whitePieces.set(a);
    this.blackPieces.set(b);
  }

  @method move(id: UInt32, path: Path) {
    // this.sender.assertEquals(Provable.switch()
    const whiteToPlay = this.whiteToPlay.getAndAssertEquals();
    const whitePieces = this.whitePieces.getAndAssertEquals();
    const blackPieces = this.blackPieces.getAndAssertEquals();
    const piecesArray = [whitePieces, blackPieces];
    const board = Board.fromEncoded(piecesArray);

    const finalPosition = path.positions[7];

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
    // piece should not be captured
    myPiece.captured.assertFalse('piece must not be captured');

    // no path positions move out of the board
    path.positions
      .map((p) => board.contains(p))
      .reduce(Bool.and)
      .assertTrue('piece cannot move out of the board');

    // piece does not capture own piece

    // path must be continuous
    // adjacent positions must be close to each other
    // 8 neighbouring positions
    // X X X
    // X P X
    // X X X
    // create adjacent pairs

    const distSquared = (p: Position, q: Position) => {
      const dx = p.x.sub(q.x);
      const dy = p.y.sub(q.y);
      return dx.mul(dx).add(dy.mul(dy));
    };

    const rightShifted = [myPiece.position, ...path.positions];
    const pathIsContinous = path.positions
      .map((p, i) => {
        const q = rightShifted[i];
        return distSquared(p, q).lessThanOrEqual(Field(2));
      })
      .reduce(Bool.and);
    Provable.switch(myPiece.rank.toBits(6), Bool, [
      Bool(true),
      pathIsContinous,
      Bool(true),
      pathIsContinous,
      pathIsContinous,
      Bool(true),
    ]).assertTrue('piece must move according to its rank');

    //the piece moves according to its rank
    const sameX = path.positions
      .map((p) => myPiece.position.x.equals(p.x))
      .reduce(Bool.and);
    const sameY = path.positions
      .map((p) => myPiece.position.y.equals(p.y))
      .reduce(Bool.and);
    const sameAddDiag = path.positions
      .map((p) =>
        p.x.add(p.y).equals(myPiece.position.y.add(myPiece.position.y))
      )
      .reduce(Bool.and);
    const sameSubDiag = path.positions
      .map((p) =>
        myPiece.position.x
          .sub(myPiece.position.x)
          .equals(myPiece.position.y.sub(myPiece.position.y))
      )
      .reduce(Bool.and);

    const rookPattern = sameX.or(sameY);
    const bishopPattern = sameAddDiag.or(sameSubDiag);
    const queenPattern = rookPattern.or(bishopPattern);

    const kingPattern = distSquared(
      myPiece.position,
      finalPosition
    ).lessThanOrEqual(Field(2));

    const knightPattern = distSquared(myPiece.position, finalPosition).equals(
      Field(5)
    );

    const pawnPattern = myPiece.rank
      .equals(RANKS.PAWN)
      .and(myPiece.position.x.equals(finalPosition.x));
    // console.log(myPiece.toString());
    Provable.switch(myPiece.rank.toBits(6), Bool, [
      pawnPattern,
      rookPattern,
      knightPattern,
      bishopPattern,
      queenPattern,
      kingPattern,
    ]).assertTrue('piece must move according to its rank');

    //Path Position should be empty except for the last one (which could be occupied by opponent piece)
    const pathIsEmpty = path.positions
      .map((pos, i) => {
        return [...Array(16).keys()]
          .map((k) => {
            //neither myPiece nor oppPiece should be at pos
            const myPieceOnPath = myPieces[k].captured
              .not()
              .and(myPieces[k].position.equals(pos));

            const oppPieceAtPath = oppPieces[k].captured
              .not()
              .and(oppPieces[k].position.equals(pos));

            // eslint-disable-next-line o1js/no-ternary-in-circuit
            return i < 7 ? myPieceOnPath.or(oppPieceAtPath) : oppPieceAtPath;
          })
          .reduce(Bool.or);
      })
      .reduce(Bool.or);

    myPiece.rank
      .equals(RANKS.KNIGHT)
      .or(pathIsEmpty)
      .assertTrue('Path must be empty');

    //NOT CHECKING move does not put own king in check
    //KING can be captured

    //update board
    // console.log('updating board');
    // console.log(finalPosition.x.toString(), finalPosition.y.toString());
    //move myPiece to final position
    [...Array(16).keys()]
      .map((i) => UInt32.from(i))
      .forEach((u, i) => {
        board.whitePieces[i] = Provable.if(
          whiteToPlay,
          Piece.from(
            Provable.if(u.equals(id), finalPosition, myPieces[i].position),
            myPieces[i].captured,
            myPieces[i].rank
          ),
          board.whitePieces[i]
        );
        board.blackPieces[i] = Provable.if(
          whiteToPlay.not(),
          Piece.from(
            Provable.if(
              u.equals(UInt32.from(i)),
              finalPosition,
              myPieces[i].position
            ),
            myPieces[i].captured,
            myPieces[i].rank
          ),
          board.blackPieces[i]
        );
      });
    //capture opponent piece if any
    [...Array(16).keys()]
      .map((i) => UInt32.from(i))
      .forEach((u, i) => {
        const captured = oppPieces[i].position.equals(finalPosition);
        board.whitePieces[i] = Provable.if(
          whiteToPlay.not(),
          Piece.from(oppPieces[i].position, captured, oppPieces[i].rank),
          board.whitePieces[i]
        );
        board.blackPieces[i] = Provable.if(
          whiteToPlay,
          Piece.from(oppPieces[i].position, captured, oppPieces[i].rank),
          board.blackPieces[i]
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
