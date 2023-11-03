import {
  Field,
  SmartContract,
  method,
  Bool,
  state,
  State,
  Provable,
  PublicKey,
} from 'o1js';

import { Position } from './Position/Position';
import { GameState } from './GameState/GameState';
import { Piece } from './Piece/Piece';
import { ChessMove } from './ChessMove';
import { RANK } from './Piece/Rank';

export { Chess };

class Chess extends SmartContract {
  @state(Field) gs0 = State<Field>();
  @state(Field) gs1 = State<Field>();
  @state(PublicKey) whiteKey = State<PublicKey>();
  @state(PublicKey) blackKey = State<PublicKey>();

  @method init() {
    super.init();
  }

  @method start(whiteKey: PublicKey, blackKey: PublicKey) {
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
    const gameState = GameState.fromFEN();
    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }

  @method move(move: ChessMove) {
    const { path, promotion } = move;
    // this.sender.assertEquals(Provable.switch())
    this.gs0.getAndAssertEquals();
    this.gs1.getAndAssertEquals();
    const gameState = GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
    //game state helpers
    const { white, black } = gameState;

    const whiteToPlay = gameState.turn;

    //path helpers
    const startPos = path.positions[0];
    const finalPos = path.positions[7];

    const self = Provable.if(whiteToPlay, white, black);
    const opponent = Provable.if(whiteToPlay, black, white);

    const fields_0to15 = [...Array(16).keys()].map((i) => Field(i));
    const ID = fields_0to15.reduce(
      (acc, u, i) =>
        Provable.if(self.pieces[i].position.equals(startPos), Field(i), acc),
      Field(-1)
    );
    ID.equals(Field(-1)).assertFalse('piece must exist at start position');

    //find my piece
    // const myPiece = self.pieces[ID];
    const myPiece = fields_0to15.reduce(
      (acc, u, i) => Provable.if(u.equals(ID), self.pieces[i], acc),
      self.pieces[0]
    );

    //verify:
    // piece should not be captured
    myPiece.captured.assertFalse('piece must not be captured');

    myPiece.position
      .equals(finalPos)
      .assertFalse('piece cannot move to its own position');

    function contains(position: Position) {
      return position.x
        .greaterThanOrEqual(Field.from(0))
        .and(position.x.lessThan(Field.from(8)))
        .and(position.y.greaterThanOrEqual(Field.from(0)))
        .and(position.y.lessThan(Field.from(8)));
    }
    // no path positions move out of the board
    path.positions
      .map((p) => contains(p))
      .reduce(Bool.and)
      .assertTrue('piece cannot move out of the board');
    // piece does not capture own piece
    function thereIsOneOfMyPiecesAt(pos: Position) {
      return [...Array(16).keys()]
        .map((k) => {
          //checking if any uncaptured my piece is at pos
          const myPieceOnPath = self.pieces[k].captured
            .not()
            .and(self.pieces[k].position.equals(pos));
          return myPieceOnPath;
        })
        .reduce(Bool.or);
    }
    function thereIsOneOfOppPiecesAt(pos: Position) {
      return [...Array(16).keys()]
        .map((k) => {
          //checking if any uncaptured opponent piece is at pos
          const oppPieceOnPath = opponent.pieces[k].captured
            .not()
            .and(opponent.pieces[k].position.equals(pos));
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

    function isIntermediatePosition(pos: Position) {
      return pos.equals(startPos).or(pos.equals(finalPos)).not();
    }
    // PATH HELPERS

    // Path is empty
    const pathIsEmpty = path.positions
      .map((p) => isIntermediatePosition(p).and(thereIsAPieceAt(p)))
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
        p.x.add(p.y).equals(myPiece.position.x.add(myPiece.position.y))
      )
      .reduce(Bool.and);
    const sameXsubY = path.positions
      .map((p) =>
        p.x.sub(p.y).equals(myPiece.position.x.sub(myPiece.position.y))
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

    const pawnMovesVerticallyForward = sameY
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
    ).and(pawnMovesVerticallyForward.or(pawnCapturesDiagonally));

    const rookPattern = sameX.or(sameY).and(pathIsValid);
    const bishopPattern = sameXaddY.or(sameXsubY).and(pathIsValid);
    const queenPattern = rookPattern.or(bishopPattern);

    const kingPattern = distSquaredToFinalPosition.lessThanOrEqual(Field(2));

    const knightPattern = distSquaredToFinalPosition.equals(Field(5));

    // piece moves according to its rank
    [
      myPiece.rank.equals(RANK.from.name.PAWN).and(pawnPattern),
      myPiece.rank.equals(RANK.from.name.ROOK).and(rookPattern),
      myPiece.rank.equals(RANK.from.name.KNIGHT).and(knightPattern),
      myPiece.rank.equals(RANK.from.name.BISHOP).and(bishopPattern),
      myPiece.rank.equals(RANK.from.name.QUEEN).and(queenPattern),
      myPiece.rank.equals(RANK.from.name.KING).and(kingPattern),
    ]
      .reduce(Bool.or)
      .assertTrue('piece must move according to its rank');

    //CURRENTLY NOT CHECKING if move puts own king in check
    //KING can be captured which declares win or loss

    //PAWN PROMOTION
    //no need to check for black or white pawns.
    const newRankIsValid = promotion
      .equals(RANK.from.name.QUEEN)
      .or(promotion.equals(RANK.from.name.ROOK))
      .or(promotion.equals(RANK.from.name.KNIGHT))
      .or(promotion.equals(RANK.from.name.BISHOP));

    const updateRank = myPiece.rank
      .equals(RANK.from.name.PAWN)
      .and(finalPos.x.equals(Field(0)).or(finalPos.x.equals(Field(7))))
      .and(newRankIsValid);

    //UPDATE GAME STATE

    //update piece position
    fields_0to15.forEach((u, i) => {
      white.pieces[i] = Provable.if(
        whiteToPlay,
        Piece.from(
          Provable.if(u.equals(ID), finalPos, self.pieces[i].position),
          self.pieces[i].captured,
          Provable.if(
            u.equals(ID).and(updateRank),
            promotion,
            self.pieces[i].rank
          )
        ),
        white.pieces[i]
      );
      black.pieces[i] = Provable.if(
        whiteToPlay.not(),
        Piece.from(
          Provable.if(u.equals(ID), finalPos, self.pieces[i].position),
          self.pieces[i].captured,
          Provable.if(
            u.equals(ID).and(updateRank),
            promotion,
            self.pieces[i].rank
          )
        ),
        black.pieces[i]
      );
    });
    //capture opponent piece if any
    fields_0to15.forEach((u, i) => {
      const captured = opponent.pieces[i].position.equals(finalPos);
      gameState.white.pieces[i] = Provable.if(
        whiteToPlay.not(),
        Piece.from(
          opponent.pieces[i].position,
          captured,
          opponent.pieces[i].rank
        ),
        white.pieces[i]
      );
      gameState.black.pieces[i] = Provable.if(
        whiteToPlay,
        Piece.from(
          opponent.pieces[i].position,
          captured,
          opponent.pieces[i].rank
        ),
        black.pieces[i]
      );
    });

    //update the state of zkapp
    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }
  getGameState() {
    return GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
  }
}
