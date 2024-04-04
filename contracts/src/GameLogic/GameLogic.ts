import { Bool, Field, Provable, provable } from 'o1js';
import { GameState } from '../GameState/GameState.js';
import { Move } from '../Move/Move.js';
import { Piece } from '../Piece/Piece.js';
import { RANKS, isRankSuitableForPromotion } from '../Piece/Rank.js';
import { Position } from '../Position/Position.js';
import { PlayerState } from '../PlayerState/PlayerState.js';

/**
 *  logic to determine various events in the game
 */
export class GameEvent {
  gameState: GameState;
  move: Move;
  moveStart: Position;
  moveEnd: Position;
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
    this.moveStart = move.path.start();
    this.moveEnd = move.path.end();
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
      this.move.path.end().row.equals(this.pawnPromotionRow),
      isRankSuitableForPromotion(this.move.promotion),
    ].reduce(Bool.and);
  }
  movesPawn() {
    const forward = this.forward;
    const forwardLeft = Position.from(
      this.moveStart.row.add(forward),
      this.moveStart.column.add(1)
    );
    const forwardRight = Position.from(
      this.moveStart.row.add(forward),
      this.moveStart.column.sub(1)
    );
    const moveCapturesPiece = () => {
      return this.gameState
        .opponent()
        .isUncapturedPieceAt(this.move.path.end());
    };
    return {
      capturingOneSquareDiagonallyForward: [
        this.piece.rank.equals(RANKS.PAWN),
        this.moveEnd.equals(forwardLeft).or(this.moveEnd.equals(forwardRight)),
        moveCapturesPiece(),
      ].reduce(Bool.and),
      oneSquareForward: [
        this.piece.rank.equals(RANKS.PAWN),
        this.moveEnd.equals(
          Position.from(this.moveStart.row.add(forward), this.moveStart.column)
        ),
        moveCapturesPiece().not(),
      ].reduce(Bool.and),
      twoSquaresForwardFromStart: [
        this.piece.rank.equals(RANKS.PAWN),
        this.moveEnd.equals(
          Position.from(
            this.moveStart.row.add(forward).add(forward),
            this.moveStart.column
          )
        ),
        moveCapturesPiece().not(),
        this.moveStart.row.equals(this.pawnStartingRow),
        this.pathIsValid,
      ].reduce(Bool.and),
      capturingEnpassantPawn: [
        this.piece.rank.equals(RANKS.PAWN),
        this.gameState.enpassant,
        this.move.path
          .end()
          .row.equals(this.move.path.start().row.add(forward)),
        this.move.path.end().equals(this.doubleForwardPawnTarget),
      ].reduce(Bool.and),
    };
  }
  movesKnight() {
    return {
      inLShape: [
        this.piece.rank.equals(RANKS.KNIGHT),
        this.moveStart.distanceSquared(this.moveEnd).equals(Field(5)),
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
        [
          this.move.path.isSameX().or(this.move.path.isSameY()),
          this.move.path.isSameXaddY().or(this.move.path.isSameXsubY()),
        ].reduce(Bool.or),
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
  gameEvent: GameEvent;
  constructor(gameState: GameState, move: Move) {
    this.gameEvent = new GameEvent(gameState, move);
  }
  public preMoveValidations() {
    const gameEvent = this.gameEvent;
    const movesPawn = gameEvent.movesPawn();
    const movesKnight = gameEvent.movesKnight();
    const movesBishop = gameEvent.movesBishop();
    const movesRook = gameEvent.movesRook();
    const movesQueen = gameEvent.movesQueen();
    const movesKing = gameEvent.movesKing();

    return [
      movesPawn,
      movesKnight,
      movesBishop,
      movesRook,
      movesQueen,
      movesKing,
    ]
      .map((m) => Object.values(m).reduce(Bool.or))
      .reduce(Bool.or);
  }
  public illegalCastling() {
    const move = this.gameEvent.move;
    //check if this move is valid
    this.preMoveValidations();
    const gameState = this.gameEvent.gameState;
    const whiteToPlay = gameState.turn;
    const opponentsCastlingRow = Provable.if(whiteToPlay, Field(0), Field(7));

    gameState.kingCastled.assertTrue('the king did not castle last move');

    // king side castling
    // 0 1 2 3 4 5 6 7
    // ? ? ? ? . K R .

    const kingCastledSide = gameState
      .opponent()
      .getKing()
      .position.column.equals(Field(5));

    const kingSideWasVulnerable = [
      Position.from(opponentsCastlingRow, 4),
      Position.from(opponentsCastlingRow, 5),
    ]
      .map((p) => p.equals(move.path.end()))
      .reduce(Bool.or);

    // queen side castling
    // 0 1 2 3 4 5 6 7
    // . . K R . ? ? ?
    const queenSideCastledSide = gameState
      .opponent()
      .getKing()
      .position.column.equals(Field(2));

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
  public getNextGameState() {
    const gameEvent = this.gameEvent;
    const gameState = gameEvent.gameState;
    const move = gameEvent.move;
    const movePromotesPawn = gameEvent.movePromotesPawn();
    const movesPawn = gameEvent.movesPawn();
    const movesKing = gameEvent.movesKing();
    const gameAdvances = gameEvent.gameAdvances();
    const self = gameState.self();
    const opponent = gameState.opponent();
    const newSelfPieces = self.pieces.map((p) => {
      const isSelectedPiece = p.position.equals(gameEvent.moveStart);
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
        gameEvent.moveEnd,
        //else if
        Provable.if(
          //the piece is the king side rook during castling
          movesKing.byCastlingKingSide.and(
            p.position.equals(kingSideRookPositionFrom)
          ),
          //move the rook to the king side rook position
          kingSideRookPositionTo,
          //else if
          Provable.if(
            //the piece is the queen side rook during castling
            movesKing.byCastlingQueenSide.and(
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
        isSelectedPiece.and(movePromotesPawn),
        move.promotion,
        p.rank
      );
      return Piece.from(newPosition, newCaptured, newRank);
    });
    const newSelfCastling = {
      kingSide: Provable.if(
        movesKing.byCastlingKingSide,
        Bool(false),
        self.castling.kingSide
      ),
      queenSide: Provable.if(
        movesKing.byCastlingQueenSide,
        Bool(false),
        self.castling.queenSide
      ),
    };

    const newSelf = PlayerState.from(newSelfPieces, newSelfCastling);
    const enpassantPawnCapture = movesPawn.capturingEnpassantPawn;
    const newOpponentPieces = opponent.pieces.map((p) => {
      const newPosition = p.position;
      const newCaptured = [
        //already captured
        p.captured,
        //captured by normal move
        p.position.equals(gameEvent.moveEnd),
        //captured by enpassant
        enpassantPawnCapture.and(
          //piece is the enpassant pawn
          p.position.equals(gameEvent.doubleForwardPawnPosition)
        ),
      ].reduce(Bool.or);
      const newRank = p.rank;
      return Piece.from(newPosition, newCaptured, newRank);
    });
    const newOpponentCastling = opponent.castling;
    const newOpponent = PlayerState.from(
      newOpponentPieces,
      newOpponentCastling
    );

    const newWhite = Provable.if(gameState.turn, newSelf, newOpponent);
    const newBlack = Provable.if(gameState.turn, newOpponent, newSelf);

    const newTurn = gameState.turn.not();

    const newEnpassant = movesPawn.twoSquaresForwardFromStart;

    const newKingCastled = [
      movesKing.byCastlingKingSide,
      movesKing.byCastlingQueenSide,
    ].reduce(Bool.or);

    const newColumn = move.path.end().column;

    const newHalfmove = Provable.if(
      gameAdvances,
      Field(0),
      gameState.halfmove.add(Field(1))
    );

    const newCanDraw = Bool(false);

    const newResult = gameState.result;

    return GameState.from(
      newWhite,
      // gameState.white,
      newBlack,
      // gameState.black,
      newTurn,
      // gameState.turn,
      newEnpassant,
      // gameState.enpassant,
      newKingCastled,
      // gameState.kingCastled,
      newColumn,
      // gameState.column,
      newHalfmove,
      // gameState.halfmove,
      newCanDraw,
      // gameState.canDraw,
      newResult
      // gameState.result
    );
  }
}
