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

  @method move(id: Field, path: Path, newRank: Field) {
    // this.sender.assertEquals(Provable.switch()
    const whiteToPlay = this.whiteToPlay.getAndAssertEquals();
    const whitePieces = this.whitePieces.getAndAssertEquals();
    const blackPieces = this.blackPieces.getAndAssertEquals();
    const piecesArray = [whitePieces, blackPieces];
    const board = Board.fromEncoded(piecesArray);

    const finalPos = path.positions[7];

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
    const fields_0to15 = [...Array(16).keys()].map((i) => Field(i));
    //find my piece
    const myPiece = fields_0to15.reduce(
      (acc, u, i) => Provable.if(id.equals(u), myPieces[i], acc),
      Piece.from(Position.from(0, 0), Bool(false), Field(0))
    );

    //verify:
    // piece should not be captured
    myPiece.captured.assertFalse('piece must not be captured');

    myPiece.position
      .equals(finalPos)
      .assertFalse('piece cannot move to its own position');
    // no path positions move out of the board
    path.positions
      .map((p) => board.contains(p))
      .reduce(Bool.and)
      .assertTrue('piece cannot move out of the board');

    // piece does not capture own piece
    function thereIsOneOfMyPiecesAt(pos: Position) {
      return [...Array(16).keys()]
        .map((k) => {
          //checking if any uncaptured my piece is at pos
          const myPieceOnPath = myPieces[k].captured
            .not()
            .and(myPieces[k].position.equals(pos));
          return myPieceOnPath;
        })
        .reduce(Bool.or);
    }
    function thereIsOneOfOppPiecesAt(pos: Position) {
      return [...Array(16).keys()]
        .map((k) => {
          //checking if any uncaptured opponent piece is at pos
          const oppPieceOnPath = oppPieces[k].captured
            .not()
            .and(oppPieces[k].position.equals(pos));
          return oppPieceOnPath;
        })
        .reduce(Bool.or);
    }
    function thereIsAPieceAt(pos: Position) {
      return thereIsOneOfMyPiecesAt(pos).or(thereIsOneOfOppPiecesAt(pos));
    }

    function getDistSquared(p: Position, q: Position) {
      const dx = p.x.sub(q.x);
      const dy = p.y.sub(q.y);
      return dx.mul(dx).add(dy.mul(dy));
    }
    // PATH HELPERS

    // Path is empty
    const pathIsEmpty = path.positions
      .slice(0, 6)
      .map(thereIsAPieceAt)
      .concat(thereIsOneOfMyPiecesAt(finalPos))
      .reduce(Bool.or)
      .not();

    // path is continous
    const rightShifted = [myPiece.position, ...path.positions];
    const pathIsContinous = path.positions
      .map((p, i) => {
        const q = rightShifted[i];
        return getDistSquared(p, q).lessThanOrEqual(Field(2));
      })
      .reduce(Bool.and);

    const pathIsValid = pathIsContinous.and(pathIsEmpty);

    // vertical path
    const sameX = path.positions
      .map((p) => myPiece.position.x.equals(p.x))
      .reduce(Bool.and);
    // horizontal path
    const sameY = path.positions
      .map((p) => myPiece.position.y.equals(p.y))
      .reduce(Bool.and);
    // diagonal paths
    const sameXaddY = path.positions
      .map((p) =>
        p.x.add(p.y).equals(myPiece.position.y.add(myPiece.position.y))
      )
      .reduce(Bool.and);
    const sameXsubY = path.positions
      .map((p) =>
        myPiece.position.x
          .sub(myPiece.position.x)
          .equals(myPiece.position.y.sub(myPiece.position.y))
      )
      .reduce(Bool.and);

    const distSquaredToFinalPosition = getDistSquared(
      myPiece.position,
      finalPos
    );
    // piece moves according to its rank

    const pawnHasNotMoved = Provable.if(
      whiteToPlay,
      myPiece.position.x.equals(Field(6)),
      myPiece.position.x.equals(Field(1))
    );

    const pawnCapturesDiagonally = sameXaddY
      .or(sameXsubY)
      .and(distSquaredToFinalPosition.equals(Field(2)))
      .and(thereIsOneOfOppPiecesAt(finalPos));

    const pawnMovesVertically = sameY
      .and(pathIsValid)
      .and(thereIsAPieceAt(finalPos).not())
      .and(
        distSquaredToFinalPosition.lessThanOrEqual(
          Provable.if(pawnHasNotMoved, Field(4), Field(1))
        )
      );

    const movesUpWards = myPiece.position.x.greaterThan(finalPos.x); //x reduces as you go up
    const movesDownWards = myPiece.position.x.lessThan(finalPos.x); //x increases as you go down

    const pawnPattern = Provable.if(
      whiteToPlay,
      movesUpWards,
      movesDownWards
    ).and(pawnMovesVertically.or(pawnCapturesDiagonally));

    const rookPattern = sameX.or(sameY).and(pathIsValid);
    const bishopPattern = sameXaddY.or(sameXsubY).and(pathIsValid);
    const queenPattern = rookPattern.or(bishopPattern);

    const kingPattern = distSquaredToFinalPosition.lessThanOrEqual(Field(2));

    const knightPattern = distSquaredToFinalPosition.equals(Field(5));

    Provable.switch(myPiece.rank.toBits(6), Bool, [
      pawnPattern,
      rookPattern,
      knightPattern,
      bishopPattern,
      queenPattern,
      kingPattern,
    ]).assertTrue('piece must move according to its rank');

    //NOT CHECKING if move puts own king in check
    //KING can be captured which declares win or loss

    //PAWN PROMOTION
    //no need to check for black or white pawns.
    const newRankIsValid = newRank
      .equals(RANKS.QUEEN)
      .or(newRank.equals(RANKS.ROOK))
      .or(newRank.equals(RANKS.KNIGHT))
      .or(newRank.equals(RANKS.BISHOP));

    const updateRank = myPiece.rank
      .equals(RANKS.PAWN)
      .and(finalPos.x.equals(Field(0)).or(finalPos.x.equals(Field(7))))
      .and(newRankIsValid);

    //update board
    fields_0to15.forEach((u, i) => {
      board.whitePieces[i] = Provable.if(
        whiteToPlay,
        Piece.from(
          Provable.if(u.equals(id), finalPos, myPieces[i].position),
          myPieces[i].captured,
          Provable.if(u.equals(id).and(updateRank), newRank, myPieces[i].rank)
        ),
        board.whitePieces[i]
      );
      board.blackPieces[i] = Provable.if(
        whiteToPlay.not(),
        Piece.from(
          Provable.if(u.equals(id), finalPos, myPieces[i].position),
          myPieces[i].captured,
          Provable.if(u.equals(id).and(updateRank), newRank, myPieces[i].rank)
        ),
        board.blackPieces[i]
      );
    });
    //capture opponent piece if any
    fields_0to15.forEach((u, i) => {
      const captured = oppPieces[i].position.equals(finalPos);
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
