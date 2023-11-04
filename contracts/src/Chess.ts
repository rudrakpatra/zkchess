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
    this.gs0.getAndAssertEquals();
    this.gs1.getAndAssertEquals();
    this.whiteKey.getAndAssertEquals();
    this.blackKey.getAndAssertEquals();

    const gameState = GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
    //game state helpers
    const { white, black } = gameState;
    const whiteToPlay = gameState.turn;
    //verify sender
    this.sender
      .equals(
        Provable.if(whiteToPlay, this.whiteKey.get(), this.blackKey.get())
      )
      .assertTrue('sender must be the player whose turn it is');

    const self = Provable.if(whiteToPlay, white, black);
    const opponent = Provable.if(whiteToPlay, black, white);

    const fields_0to15 = [...Array(16).keys()].map((i) => Field(i));

    //path helpers
    const startPos = path.positions[0];
    const finalPos = path.positions[7];

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

    // where the pawn is present
    const enpassantTargetPos = Position.from(
      Provable.if(whiteToPlay, Field(2), Field(5)),
      finalPos.y
    );

    const enpassantPawnPos = Position.from(
      Provable.if(whiteToPlay, Field(3), Field(4)),
      finalPos.y
    );

    const capturesNormally = [
      sameXaddY.or(sameXsubY),
      distSquaredToFinalPosition.equals(Field(2)),
      thereIsOneOfOppPiecesAt(finalPos),
    ].reduce(Bool.and);

    const capturesUsingEnpassant = [
      sameXaddY.or(sameXsubY), //moves diagonally
      distSquaredToFinalPosition.equals(Field(2)), //one square
      gameState.enpassant, //last player's pawn moved two squares
      finalPos.equals(enpassantTargetPos), // moves to enpassant pawn position
    ].reduce(Bool.and);

    const hasNotMoved = Provable.if(
      whiteToPlay,
      myPiece.position.x.equals(Field(6)),
      myPiece.position.x.equals(Field(1))
    );

    const movesOneSquareVertically = [
      distSquaredToFinalPosition.equals(Field(1)),
      thereIsAPieceAt(finalPos).not(),
      sameY,
    ].reduce(Bool.and);

    const moveTwoSquaresVerically = [
      distSquaredToFinalPosition.equals(Field(4)),
      thereIsAPieceAt(finalPos).not(),
      hasNotMoved,
      pathIsValid,
      sameY,
    ].reduce(Bool.and);

    const movesUpWards = myPiece.position.x.greaterThan(finalPos.x); //x reduces as you go up
    const movesDownWards = myPiece.position.x.lessThan(finalPos.x); //x increases as you go down

    const pawnMove = [
      Provable.if(whiteToPlay, movesUpWards, movesDownWards),
      [
        capturesNormally,
        capturesUsingEnpassant,
        movesOneSquareVertically,
        moveTwoSquaresVerically,
      ].reduce(Bool.or),
    ].reduce(Bool.and);

    const rookMove = sameX.or(sameY).and(pathIsValid);
    const bishopMove = sameXaddY.or(sameXsubY).and(pathIsValid);
    const queenMove = rookMove.or(bishopMove);

    //castling
    const castlingMove = {
      white: {
        kingSide: [
          white.castling.kingSide,
          thereIsAPieceAt(Position.from(7, 5)).not(),
          thereIsAPieceAt(Position.from(7, 6)).not(),
          finalPos.equals(Position.from(7, 6)),
        ].reduce(Bool.and),
        queenSide: [
          white.castling.queenSide,
          thereIsAPieceAt(Position.from(7, 3)).not(),
          thereIsAPieceAt(Position.from(7, 2)).not(),
          thereIsAPieceAt(Position.from(7, 1)).not(),
          finalPos.equals(Position.from(7, 2)),
        ].reduce(Bool.and),
      },
      black: {
        kingSide: [
          black.castling.kingSide,
          thereIsAPieceAt(Position.from(0, 5)).not(),
          thereIsAPieceAt(Position.from(0, 6)).not(),
          finalPos.equals(Position.from(0, 6)),
        ].reduce(Bool.and),
        queenSide: [
          black.castling.queenSide,
          thereIsAPieceAt(Position.from(0, 3)).not(),
          thereIsAPieceAt(Position.from(0, 2)).not(),
          thereIsAPieceAt(Position.from(0, 1)).not(),
          finalPos.equals(Position.from(0, 2)),
        ].reduce(Bool.and),
      },
    };

    const kingMove = [
      distSquaredToFinalPosition.lessThanOrEqual(Field(2)),
      whiteToPlay.and(castlingMove.white.kingSide),
      whiteToPlay.and(castlingMove.white.queenSide),
      whiteToPlay.not().and(castlingMove.black.kingSide),
      whiteToPlay.not().and(castlingMove.black.queenSide),
    ].reduce(Bool.or);

    const knightMove = distSquaredToFinalPosition.equals(Field(5));

    // piece moves according to its rank
    [
      myPiece.rank.equals(RANK.from.name.PAWN).and(pawnMove),
      myPiece.rank.equals(RANK.from.name.ROOK).and(rookMove),
      myPiece.rank.equals(RANK.from.name.KNIGHT).and(knightMove),
      myPiece.rank.equals(RANK.from.name.BISHOP).and(bishopMove),
      myPiece.rank.equals(RANK.from.name.QUEEN).and(queenMove),
      myPiece.rank.equals(RANK.from.name.KING).and(kingMove),
    ]
      .reduce(Bool.or)
      .assertTrue('piece must move according to its rank');

    //CURRENTLY NOT CHECKING if move puts own king in check
    //KING can be captured which declares win or loss

    //PAWN PROMOTION
    //no need to check for black or white pawns.
    const newRankIsValid = [
      RANK.from.name.QUEEN,
      RANK.from.name.ROOK,
      RANK.from.name.KNIGHT,
      RANK.from.name.BISHOP,
    ]
      .map((x) => promotion.equals(Field(x)))
      .reduce(Bool.or);

    const shouldUpdateRank = myPiece.rank
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
            u.equals(ID).and(shouldUpdateRank),
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
            u.equals(ID).and(shouldUpdateRank),
            promotion,
            self.pieces[i].rank
          )
        ),
        black.pieces[i]
      );
    });

    //capture opponent piece if any
    fields_0to15.forEach((u, i) => {
      const pieceCaptured = [
        //already captured
        opponent.pieces[i].captured,
        //captured by normal move
        opponent.pieces[i].position.equals(finalPos),
        //enpassant pawn captured by pawn
        [
          opponent.pieces[i].rank.equals(RANK.from.name.PAWN),
          opponent.pieces[i].position.equals(enpassantPawnPos),
          myPiece.rank.equals(RANK.from.name.PAWN),
          capturesUsingEnpassant,
        ].reduce(Bool.and),
      ].reduce(Bool.or);

      gameState.white.pieces[i] = Provable.if(
        whiteToPlay.not(), // then white is opponent
        Piece.from(
          white.pieces[i].position,
          pieceCaptured,
          white.pieces[i].rank
        ),
        white.pieces[i]
      );
      gameState.black.pieces[i] = Provable.if(
        whiteToPlay, //then black is opponent
        Piece.from(
          black.pieces[i].position,
          pieceCaptured,
          black.pieces[i].rank
        ),
        black.pieces[i]
      );
    });

    //update turn
    gameState.turn = whiteToPlay.not();

    //update castling rights

    const whiteKingCastledKingSide = [
      whiteToPlay,
      myPiece.rank.equals(RANK.from.name.KING),
      castlingMove.white.kingSide,
    ].reduce(Bool.and);

    const whiteKingCastledQueenSide = [
      whiteToPlay,
      myPiece.rank.equals(RANK.from.name.KING),
      castlingMove.white.queenSide,
    ].reduce(Bool.and);

    const blackKingCastledKingSide = [
      whiteToPlay.not(),
      myPiece.rank.equals(RANK.from.name.KING),
      castlingMove.black.kingSide,
    ].reduce(Bool.and);

    const blackKingCastledQueenSide = [
      whiteToPlay.not(),
      myPiece.rank.equals(RANK.from.name.KING),
      castlingMove.black.queenSide,
    ].reduce(Bool.and);

    gameState.white.castling.kingSide = Provable.if(
      whiteKingCastledKingSide,
      Bool(false),
      white.castling.kingSide
    );
    gameState.white.castling.queenSide = Provable.if(
      whiteKingCastledQueenSide,
      Bool(false),
      white.castling.queenSide
    );
    gameState.black.castling.kingSide = Provable.if(
      blackKingCastledKingSide,
      Bool(false),
      black.castling.kingSide
    );
    gameState.black.castling.queenSide = Provable.if(
      blackKingCastledQueenSide,
      Bool(false),
      black.castling.queenSide
    );
    //update rook position if castling

    const castlingRookPos = {
      white: {
        kingSide: {
          from: Position.from(7, 7),
          to: Position.from(7, 5),
        },
        queenSide: {
          from: Position.from(7, 0),
          to: Position.from(7, 3),
        },
      },
      black: {
        kingSide: {
          from: Position.from(0, 7),
          to: Position.from(0, 5),
        },
        queenSide: {
          from: Position.from(0, 0),
          to: Position.from(0, 3),
        },
      },
    };
    fields_0to15.forEach((u, i) => {
      const whiteRookKingSideCastled = [
        whiteKingCastledKingSide,
        white.pieces[i].position.equals(castlingRookPos.white.kingSide.from),
      ].reduce(Bool.and);

      const whiteRookQueenSideCastled = [
        whiteKingCastledQueenSide,
        white.pieces[i].position.equals(castlingRookPos.white.queenSide.from),
      ].reduce(Bool.and);

      const blackRookKingSideCastled = [
        blackKingCastledKingSide,
        black.pieces[i].position.equals(castlingRookPos.black.kingSide.from),
      ].reduce(Bool.and);

      const blackRookQueenSideCastled = [
        blackKingCastledQueenSide,
        black.pieces[i].position.equals(castlingRookPos.black.queenSide.from),
      ].reduce(Bool.and);

      white.pieces[i].position = Provable.if(
        whiteRookKingSideCastled,
        castlingRookPos.white.kingSide.to,
        white.pieces[i].position
      );
      white.pieces[i].position = Provable.if(
        whiteRookQueenSideCastled,
        castlingRookPos.white.queenSide.to,
        white.pieces[i].position
      );
      black.pieces[i].position = Provable.if(
        blackRookKingSideCastled,
        castlingRookPos.black.kingSide.to,
        black.pieces[i].position
      );
      black.pieces[i].position = Provable.if(
        blackRookQueenSideCastled,
        castlingRookPos.black.queenSide.to,
        black.pieces[i].position
      );
    });

    //update enpassant
    gameState.enpassant = [
      myPiece.rank.equals(RANK.from.name.PAWN),
      distSquaredToFinalPosition.equals(Field(4)),
    ].reduce(Bool.and);

    gameState.column = finalPos.y;

    //update halfmove
    const halfmove = gameState.halfmove;
    const halfmoveIs100 = gameState.halfmove.equals(Field(100));
    const gameAdvances = [
      myPiece.rank.equals(RANK.from.name.PAWN),
      thereIsOneOfOppPiecesAt(finalPos),
    ].reduce(Bool.or);
    gameState.halfmove = Provable.if(
      gameAdvances,
      Field(0),
      Provable.if(halfmoveIs100, halfmove, halfmove.add(Field(1)))
    );

    // TODO: stalemate
    // there is a possibleMoveLeft for the next player
    // the current player must provide a valid possible move for the next player (witness)
    // the possible move should be private

    const possiblyNoValidMoveLeft = Bool(false);

    //update canDraw
    gameState.canDraw = [halfmoveIs100, possiblyNoValidMoveLeft].reduce(
      Bool.or
    );

    //update the state of zkapp
    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }
  @method draw() {
    this.gs0.getAndAssertEquals();
    this.gs1.getAndAssertEquals();
    this.whiteKey.getAndAssertEquals();
    this.blackKey.getAndAssertEquals();

    const gameState = GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
    //game state helpers
    const { white, black } = gameState;
    const whiteToPlay = gameState.turn;
    //verify sender
    this.sender
      .equals(
        Provable.if(whiteToPlay, this.whiteKey.get(), this.blackKey.get())
      )
      .assertTrue('sender must be the player whose turn it is');

    const fields_0to15 = [...Array(16).keys()].map((i) => Field(i));

    //UPDATE GAME STATE
    fields_0to15.forEach((u, i) => {
      gameState.white.pieces[i] = Provable.if(
        white.pieces[i].rank.equals(RANK.from.name.KING),
        Piece.from(white.pieces[i].position, Bool(true), white.pieces[i].rank),
        white.pieces[i]
      );
      gameState.black.pieces[i] = Provable.if(
        black.pieces[i].rank.equals(RANK.from.name.KING),
        Piece.from(black.pieces[i].position, Bool(true), black.pieces[i].rank),
        black.pieces[i]
      );
    });

    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }

  @method resign() {
    this.gs0.getAndAssertEquals();
    this.gs1.getAndAssertEquals();
    this.whiteKey.getAndAssertEquals();
    this.blackKey.getAndAssertEquals();

    const gameState = GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
    //game state helpers
    const { white, black } = gameState;
    const whiteToPlay = gameState.turn;
    //verify sender
    this.sender
      .equals(
        Provable.if(whiteToPlay, this.whiteKey.get(), this.blackKey.get())
      )
      .assertTrue('sender must be the player whose turn it is');

    const fields_0to15 = [...Array(16).keys()].map((i) => Field(i));

    //UPDATE GAME STATE
    fields_0to15.forEach((u, i) => {
      gameState.white.pieces[i] = Provable.if(
        whiteToPlay.and(white.pieces[i].rank.equals(RANK.from.name.KING)),
        Piece.from(white.pieces[i].position, Bool(true), white.pieces[i].rank),
        white.pieces[i]
      );
      gameState.black.pieces[i] = Provable.if(
        whiteToPlay.not().and(black.pieces[i].rank.equals(RANK.from.name.KING)),
        Piece.from(black.pieces[i].position, Bool(true), black.pieces[i].rank),
        black.pieces[i]
      );
    });
    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }
  getGameState() {
    return GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
  }
}
