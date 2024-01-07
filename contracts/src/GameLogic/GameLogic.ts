import { Bool, Field, Provable } from 'o1js';
import { GameState } from '../GameState/GameState';
import { Move } from '../Move/Move';
import { Piece } from '../Piece/Piece';
import { RANKS, isRankSuitableForPromotion } from '../Piece/Rank';
import { Position } from '../Position/Position';
import { PlayerState } from '../PlayerState/PlayerState';

/**
 *  logic to determine various events in the game
 */
class GameEvent {
  gameState: GameState;
  move: Move;
  pathIsValid: Bool;
  //piece that is moving
  piece: Piece;
  forward: Field;
  /**
   * where the pawn is after a double forward move
   */
  doubleForwardPawnPosition: Position;
  /**
   * where the pawn can be captured by enpassant rule
   */
  doubleForwardPawnTarget: Position;
  pawnStartingRow: Field;
  pawnPromotionRow: Field;
  castlingRow: Field;
  /**
   *
   * @param gameState
   * @param move
   */
  constructor(gameState: GameState, move: Move) {
    this.gameState = gameState;
    this.move = move;
    this.pathIsValid = move.path.isValid(gameState);
    //we assert that the piece is present at the start of the path
    this.piece = gameState.self().checkAndGetUncapturedPieceAt(
      // to keep the path connected and reachable by the piece
      move.path.start()
    );
    const whiteToPlay = gameState.turn;
    //white moves up, black moves down
    this.forward = Provable.if(whiteToPlay, Field(-1), Field(1));
    const enpassantRow = Provable.if(whiteToPlay, Field(3), Field(4));
    this.doubleForwardPawnPosition = Position.from(
      enpassantRow,
      gameState.column
    );
    this.doubleForwardPawnTarget = Position.from(
      enpassantRow.add(this.forward),
      gameState.column
    );
    this.pawnStartingRow = Provable.if(whiteToPlay, Field(6), Field(1));
    this.pawnPromotionRow = Provable.if(whiteToPlay, Field(0), Field(7));
    this.castlingRow = Provable.if(whiteToPlay, Field(7), Field(0));
  }

  movePromotesPawn() {
    return [
      this.piece.rank.equals(RANKS.PAWN),
      this.move.path.end().y.equals(this.pawnPromotionRow),
      isRankSuitableForPromotion(this.move.promotion),
    ].reduce(Bool.and);
  }
  movesPawn() {
    const forward = this.forward;
    const startPos = this.move.path.start();
    const endPos = this.move.path.end();

    const forwardLeft = Position.from(
      startPos.x.add(forward),
      startPos.y.add(1)
    );
    const forwardRight = Position.from(
      startPos.x.add(forward),
      startPos.y.sub(1)
    );
    const moveCapturesPiece = () => {
      return this.gameState
        .opponent()
        .isUncapturedPieceAt(this.move.path.end());
    };
    return {
      capturingOneSquareDiagonallyForward: [
        this.piece.rank.equals(RANKS.PAWN),
        endPos.equals(forwardLeft).or(endPos.equals(forwardRight)),
        moveCapturesPiece(),
      ].reduce(Bool.and),
      oneSquareForward: [
        this.piece.rank.equals(RANKS.PAWN),
        endPos.equals(Position.from(startPos.x.add(forward), startPos.y)),
        moveCapturesPiece().not(),
      ].reduce(Bool.and),
      twoSquaresForwardFromStart: [
        this.piece.rank.equals(RANKS.PAWN),
        endPos.equals(
          Position.from(startPos.x.add(forward).add(forward), startPos.y)
        ),
        moveCapturesPiece().not(),
        startPos.x.equals(this.pawnStartingRow),
        this.pathIsValid,
      ].reduce(Bool.and),
      capturingEnpassantPawn: [
        this.piece.rank.equals(RANKS.PAWN),
        this.gameState.enpassant,
        this.move.path.end().x.equals(this.move.path.start().x.add(forward)),
        this.move.path.end().equals(this.doubleForwardPawnTarget),
      ].reduce(Bool.and),
    };
  }
  movesKnight() {
    const startPos = this.move.path.start();
    const endPos = this.move.path.end();
    return {
      inLShape: [
        this.piece.rank.equals(RANKS.KNIGHT),
        startPos.distanceSquared(endPos).equals(Field(5)),
      ].reduce(Bool.and),
    };
  }
  movesBishop() {
    return {
      alongDiagonal: [
        this.piece.rank.equals(RANKS.BISHOP),
        this.move.path.isSameXaddY().or(this.move.path.isSameXsubY()),
        this.pathIsValid,
      ].reduce(Bool.and),
    };
  }
  movesRook() {
    return {
      alongRowOrCol: [
        this.piece.rank.equals(RANKS.ROOK),
        this.move.path.isSameX().or(this.move.path.isSameY()),
        this.pathIsValid,
      ].reduce(Bool.and),
    };
  }
  movesQueen() {
    return {
      alongRowOrColOrDiagonal: [
        this.piece.rank.equals(RANKS.QUEEN),
        this.move.path.isSameX().or(this.move.path.isSameY()),
        this.move.path.isSameXaddY().or(this.move.path.isSameXsubY()),
        this.pathIsValid,
      ].reduce(Bool.and),
    };
  }
  movesKing() {
    const kingSideCastlingPathisClear = [
      Position.from(this.castlingRow, 5),
      Position.from(this.castlingRow, 6),
    ]
      .map((p) => this.gameState.isUncapturedPieceAt(p).not())
      .reduce(Bool.and);
    const queenSideCastlingPathIsClear = [
      Position.from(this.castlingRow, 3),
      Position.from(this.castlingRow, 2),
      Position.from(this.castlingRow, 1),
    ]
      .map((p) => this.gameState.isUncapturedPieceAt(p).not())
      .reduce(Bool.and);

    return {
      oneSquareInAnyDirection: [
        this.piece.rank.equals(RANKS.KING),
        this.move.path
          .start()
          .distanceSquared(this.move.path.end())
          .lessThan(Field(3)),
      ].reduce(Bool.and),
      byCastlingKingSide: [
        this.piece.rank.equals(RANKS.KING),
        this.gameState.self().castling.kingSide,
        kingSideCastlingPathisClear,
        this.move.path.end().equals(Position.from(this.castlingRow, 6)),
      ].reduce(Bool.and),
      byCastlingQueenSide: [
        this.piece.rank.equals(RANKS.KING),
        this.gameState.self().castling.queenSide,
        queenSideCastlingPathIsClear,
        this.move.path.end().equals(Position.from(this.castlingRow, 2)),
      ].reduce(Bool.and),
    };
  }

  gameAdvances() {
    return [
      this.piece.rank.equals(RANKS.PAWN),
      this.gameState.opponent().isUncapturedPieceAt(this.move.path.end()),
    ].reduce(Bool.or);
  }
}
export class GameObject {
  state: GameState;
  constructor(gameState: GameState) {
    this.state = gameState;
  }
  public preMoveValidations(move: Move) {
    const gameEvent = new GameEvent(this.state, move);
    return [
      gameEvent.movesPawn(),
      gameEvent.movesKnight(),
      gameEvent.movesBishop(),
      gameEvent.movesRook(),
      gameEvent.movesQueen(),
      gameEvent.movesKing(),
    ]
      .map((m) => Object.values(m).reduce(Bool.or))
      .reduce(Bool.or);
  }
  public illegalCastling(move: Move) {
    //check if this move is valid
    this.preMoveValidations(move);

    const whiteToPlay = this.state.turn;
    const opponentsCastlingRow = Provable.if(whiteToPlay, Field(0), Field(7));

    this.state.kingCastled.assertTrue('the king did not castle last move');

    // king side castling
    // 0 1 2 3 4 5 6 7
    // ? ? ? ? . K R .

    const kingCastledSide = this.state
      .opponent()
      .getKing()
      .position.x.equals(Field(5));

    const kingSideWasVulnerable = [
      Position.from(opponentsCastlingRow, 4),
      Position.from(opponentsCastlingRow, 5),
    ]
      .map((p) => p.equals(move.path.end()))
      .reduce(Bool.or);

    // queen side castling
    // 0 1 2 3 4 5 6 7
    // . . K R . ? ? ?
    const queenSideCastledSide = this.state
      .opponent()
      .getKing()
      .position.x.equals(Field(2));

    const queenSideWasVulnerable = [
      Position.from(opponentsCastlingRow, 4),
      Position.from(opponentsCastlingRow, 3),
      Position.from(opponentsCastlingRow, 2),
    ]
      .map((p) => p.equals(move.path.end()))
      .reduce(Bool.or);

    //lastly we determine if this castling was illegal like this
    return [
      kingCastledSide.and(kingSideWasVulnerable),
      queenSideCastledSide.and(queenSideWasVulnerable),
    ].reduce(Bool.or);
  }
  /**
   * returns a updated game state
   *
   * **warning** does not update result
   * @param move
   */
  public toUpdated(move: Move) {
    const gameEvent = new GameEvent(this.state, move);
    const newSelfPieces = this.state.self().pieces.map((p) => {
      const isSelectedPiece = p.position.equals(move.path.start());
      //king side rook move when castling
      const kingSideRookPositionFrom = Position.from(gameEvent.castlingRow, 7);
      const kingSideRookPositionTo = Position.from(gameEvent.castlingRow, 5);

      //queen side rook move when castling
      const queenSideRookPositionFrom = Position.from(gameEvent.castlingRow, 0);
      const queenSideRookPositionTo = Position.from(gameEvent.castlingRow, 3);

      const newPosition = Provable.if(
        //move the selected piece
        isSelectedPiece,
        //to the end of the path
        move.path.end(),
        //else if
        Provable.if(
          //the piece is the king side rook during castling
          gameEvent
            .movesKing()
            .byCastlingKingSide.and(
              p.position.equals(kingSideRookPositionFrom)
            ),
          //move the rook to the king side rook position
          kingSideRookPositionTo,
          //else if
          Provable.if(
            //the piece is the queen side rook during castling
            gameEvent
              .movesKing()
              .byCastlingQueenSide.and(
                p.position.equals(queenSideRookPositionFrom)
              ),
            //move the rook to the queen side rook position
            queenSideRookPositionTo,
            //else
            p.position
            // leave the piece where it is
          )
        )
      );
      const newCaptured = p.captured;
      const newRank = Provable.if(
        isSelectedPiece.and(gameEvent.movePromotesPawn()),
        move.promotion,
        p.rank
      );
      return Piece.from(newPosition, newCaptured, newRank);
    });
    const newSelfCastling = {
      kingSide: Provable.if(
        gameEvent.movesKing().byCastlingKingSide,
        Bool(false),
        this.state.self().castling.kingSide
      ),
      queenSide: Provable.if(
        gameEvent.movesKing().byCastlingQueenSide,
        Bool(false),
        this.state.self().castling.queenSide
      ),
    };

    const newSelf = PlayerState.from(newSelfPieces, newSelfCastling);

    const newOpponentPieces = this.state.opponent().pieces.map((p) => {
      const newPosition = p.position;
      const enpassantPawnCapture = gameEvent.movesPawn().capturingEnpassantPawn;

      const newCaptured = [
        //already captured
        p.captured,
        //captured by normal move
        p.position.equals(move.path.end()),
        //captured by enpassant
        enpassantPawnCapture.and(
          //piece is the enpassant pawn
          p.position.equals(gameEvent.doubleForwardPawnPosition)
        ),
      ].reduce(Bool.or);
      const newRank = p.rank;
      return Piece.from(newPosition, newCaptured, newRank);
    });
    const newOpponentCastling = this.state.opponent().castling;
    const newOpponent = PlayerState.from(
      newOpponentPieces,
      newOpponentCastling
    );

    const newWhite = Provable.if(this.state.turn, newSelf, newOpponent);
    const newBlack = Provable.if(this.state.turn, newOpponent, newSelf);

    const newTurn = this.state.turn.not();

    const newEnpassant = gameEvent.movesPawn().twoSquaresForwardFromStart;

    const newKingCastled = [
      gameEvent.movesKing().byCastlingKingSide,
      gameEvent.movesKing().byCastlingQueenSide,
    ].reduce(Bool.or);

    const newColumn = move.path.end().y;

    const newHalfmove = Provable.if(
      gameEvent.gameAdvances(),
      Field(0),
      this.state.halfmove.add(Field(1))
    );

    const newCanDraw = Bool(false);

    const newResult = this.state.result;

    return GameState.from(
      newWhite,
      newBlack,
      newTurn,
      newEnpassant,
      newKingCastled,
      newColumn,
      newHalfmove,
      newCanDraw,
      newResult
    );
  }
}
