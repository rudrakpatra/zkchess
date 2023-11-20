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
import { PlayerState } from './GameState/PlayerState/PlayerState';

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
    this.setGameState(GameState.fromFEN());
  }

  getAndAssertEqualsState() {
    this.gs0.getAndAssertEquals();
    this.gs1.getAndAssertEquals();
    this.whiteKey.getAndAssertEquals();
    this.blackKey.getAndAssertEquals();
  }
  verifySender(gameState: GameState) {
    this.sender
      .equals(
        Provable.if(gameState.turn, this.whiteKey.get(), this.blackKey.get())
      )
      .assertTrue('sender must be the player whose turn it is');
  }
  getGameState() {
    return GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
  }
  setGameState(gameState: GameState) {
    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }

  @method move(move: ChessMove) {
    this.getAndAssertEqualsState();
    const gameState = this.getGameState();
    this.verifySender(gameState);

    const { path, promotion } = move;

    //game state helpers
    const whiteToPlay = gameState.turn;

    const self = gameState.self();
    const opponent = gameState.opponent();

    //path helpers
    const startPos = path.start();
    const endPos = path.end();
    const pathIsValid = path.isValid(gameState);
    //find my piece
    // const myPiece = self.get.pieces[ID];
    const myPiece = self.playerState.getUncapturedPieceAt(startPos);

    const ID = self.playerState.pieces.reduce(
      (acc, _, i) =>
        Provable.if(
          self.playerState.pieces[i].position.equals(startPos),
          Field(i),
          acc
        ),
      Field(-1)
    );

    //verify:
    // piece should not be captured
    myPiece.captured.assertFalse('piece must not be captured');

    myPiece.position
      .equals(endPos)
      .assertFalse('piece cannot move to its own position');

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
    // PIECE MOVEMENT

    const _forward = Provable.if(whiteToPlay, Field(-1), Field(1)); //white moves up, black moves down
    const capturesOneSquareDiagonallyForward = [
      [
        endPos.equals(
          Position.from(startPos.x.add(_forward), startPos.y.add(1))
        ),
        endPos.equals(
          Position.from(startPos.x.add(_forward), startPos.y.sub(1))
        ),
      ].reduce(Bool.or),
      opponent.playerState.isUncapturedPieceAt(endPos),
    ].reduce(Bool.and);

    const movesOneSquareForward = [
      endPos.equals(Position.from(startPos.x.add(_forward), startPos.y)),
      gameState.isUncapturedPieceAt(endPos).not(),
    ].reduce(Bool.and);

    const pawnMove = [
      [capturesOneSquareDiagonallyForward, movesOneSquareForward].reduce(
        Bool.or
      ),
    ].reduce(Bool.and);

    const rookMove = sameX.or(sameY).and(pathIsValid);
    const bishopMove = sameXaddY.or(sameXsubY).and(pathIsValid);
    const queenMove = rookMove.or(bishopMove);

    //pawn
    const _enpassantRow = Provable.if(whiteToPlay, Field(2), Field(5));
    const _pawnRow = Provable.if(whiteToPlay, Field(6), Field(1));
    const _shouldPromote = myPiece.rank
      .equals(RANK.from.name.PAWN)
      .and(endPos.x.equals(Field(0)).or(endPos.x.equals(Field(7))))
      .and(
        //promotion rank is one of the following
        [
          RANK.from.name.QUEEN,
          RANK.from.name.ROOK,
          RANK.from.name.KNIGHT,
          RANK.from.name.BISHOP,
        ]
          .map((x) => promotion.equals(Field(x)))
          .reduce(Bool.or)
      );
    //castling
    const _castlingRow = Provable.if(whiteToPlay, Field(7), Field(0));

    //SPECIAL EVENTS
    const SPECIAL_EVENTS = {
      castling: {
        kingSide: {
          cond: [
            //mypiece is king
            myPiece.rank.equals(RANK.from.name.KING),
            //castling rights
            self.playerState.castling.kingSide,
            //no piece between king and rook
            gameState.isUncapturedPieceAt(Position.from(_castlingRow, 5)).not(),
            gameState.isUncapturedPieceAt(Position.from(_castlingRow, 6)).not(),
            //king moves two squares
            endPos.equals(Position.from(_castlingRow, 6)),
          ].reduce(Bool.and),

          //effect
          moves: {
            rook: {
              from: Position.from(_castlingRow, 7),
              to: Position.from(_castlingRow, 5),
            },
          },
        },
        queenSide: {
          cond: [
            //mypiece is king
            myPiece.rank.equals(RANK.from.name.KING),
            //castling rights
            self.playerState.castling.queenSide,
            //no piece between king and rook
            gameState.isUncapturedPieceAt(Position.from(_castlingRow, 3)).not(),
            gameState.isUncapturedPieceAt(Position.from(_castlingRow, 2)).not(),
            gameState.isUncapturedPieceAt(Position.from(_castlingRow, 1)).not(),
            //king moves two squares
            endPos.equals(Position.from(_castlingRow, 2)),
          ].reduce(Bool.and),
          //effect
          moves: {
            rook: {
              from: Position.from(_castlingRow, 0),
              to: Position.from(_castlingRow, 3),
            },
          },
        },
      },
      pawnMovesTwoSquaresForward: {
        cond: [
          //my piece is pawn
          myPiece.rank.equals(RANK.from.name.PAWN),
          //pawn is its starting row
          startPos.x.equals(_pawnRow),
          //my piece moves two squares forward
          endPos.equals(
            Position.from(startPos.x.add(_forward.mul(Field(2))), startPos.y)
          ),
          //path is valid
          pathIsValid,
        ].reduce(Bool.and),
        //effect
      },
      capturesEnpassantPawn: {
        cond: [
          //enpassant check
          gameState.enpassant,
          //my piece is pawn
          myPiece.rank.equals(RANK.from.name.PAWN),
          //moves one square forward
          endPos.x.equals(startPos.x.add(_forward)),
          //captures enpassant pawn
          endPos.equals(Position.from(_enpassantRow, gameState.column)),
        ].reduce(Bool.and),
        //effect
        captures: {
          enpassantPawn: Position.from(
            startPos.x.sub(_forward),
            gameState.column
          ),
        },
      },
    };

    const kingMove = [
      startPos.distanceSquared(endPos).lessThanOrEqual(Field(2)),
    ].reduce(Bool.or);
    const knightMove = startPos.distanceSquared(endPos).equals(Field(5));
    // piece moves according to its rank
    [
      myPiece.rank.equals(RANK.from.name.PAWN).and(pawnMove),
      myPiece.rank.equals(RANK.from.name.ROOK).and(rookMove),
      myPiece.rank.equals(RANK.from.name.KNIGHT).and(knightMove),
      myPiece.rank.equals(RANK.from.name.BISHOP).and(bishopMove),
      myPiece.rank.equals(RANK.from.name.QUEEN).and(queenMove),
      myPiece.rank.equals(RANK.from.name.KING).and(kingMove),
      //SPECIAL EVENTS
      SPECIAL_EVENTS.castling.kingSide.cond,
      SPECIAL_EVENTS.castling.queenSide.cond,
      SPECIAL_EVENTS.pawnMovesTwoSquaresForward.cond,
      SPECIAL_EVENTS.capturesEnpassantPawn.cond,
    ]
      .reduce(Bool.or)
      .assertTrue('piece must move according to its rank');

    //CURRENTLY NOT CHECKING if move puts own king in check
    //KING can be captured which declares win or loss

    //UPDATE GAME STATE
    self.setPlayerState(
      PlayerState.from(
        self.playerState.pieces.map((piece, i) => {
          const IDMatch = Field(i).equals(ID);

          let position = piece.position;
          //normal move
          position = Provable.if(IDMatch, endPos, position);

          const castling = SPECIAL_EVENTS.castling;

          //king side rook move when castling
          position = Provable.if(
            castling.kingSide.cond.and(
              castling.kingSide.moves.rook.from.equals(piece.position)
            ),
            castling.kingSide.moves.rook.to,
            position
          );
          //queen side rook move when castling
          position = Provable.if(
            castling.queenSide.cond.and(
              castling.queenSide.moves.rook.from.equals(piece.position)
            ),
            castling.queenSide.moves.rook.to,
            position
          );

          const captured = piece.captured;
          const rank = Provable.if(
            IDMatch.and(_shouldPromote),
            promotion,
            piece.rank
          );
          return Piece.from(position, captured, rank);
        }),
        {
          kingSide: Provable.if(
            SPECIAL_EVENTS.castling.kingSide.cond,
            Bool(false), // remove castling rights
            self.playerState.castling.kingSide // propagate last state
          ),
          queenSide: Provable.if(
            SPECIAL_EVENTS.castling.queenSide.cond,
            Bool(false), // remove castling rights
            self.playerState.castling.queenSide // propagate last state
          ),
        }
      )
    );
    opponent.setPlayerState(
      PlayerState.from(
        opponent.playerState.pieces.map((piece, i) => {
          const position = piece.position;
          const enpassantPawnCapture = SPECIAL_EVENTS.capturesEnpassantPawn;
          const captured = [
            //already captured
            piece.captured,
            //captured by normal move
            piece.position.equals(endPos),
            //enpassant pawn captured by pawn
            [
              enpassantPawnCapture.cond,
              //piece is the enpassant pawn
              enpassantPawnCapture.captures.enpassantPawn.equals(
                piece.position
              ),
            ].reduce(Bool.and),
          ].reduce(Bool.or);

          const rank = piece.rank;

          return Piece.from(position, captured, rank);
        }),
        opponent.playerState.castling
      )
    );

    //update turn
    gameState.turn = whiteToPlay.not();

    //update enpassant
    gameState.enpassant = SPECIAL_EVENTS.pawnMovesTwoSquaresForward.cond;

    gameState.column = endPos.y;

    //update halfmove
    const halfmove = gameState.halfmove;
    const halfmoveIs150 = gameState.halfmove.equals(Field(150));
    const gameAdvances = [
      myPiece.rank.equals(RANK.from.name.PAWN),
      opponent.playerState.isUncapturedPieceAt(endPos),
    ].reduce(Bool.or);

    gameState.halfmove = Provable.if(
      gameAdvances,
      Field(0),
      Provable.if(halfmoveIs150, halfmove, halfmove.add(Field(1)))
    );

    // TODO: stalemate
    // there is a possibleMoveLeft for the next player
    // the current player must provide a valid possible move for the next player (witness)
    // the possible move should be private

    const possiblyNoValidMoveLeft = Bool(false);

    //update canDraw
    gameState.canDraw = [halfmoveIs150, possiblyNoValidMoveLeft].reduce(
      Bool.or
    );

    this.setGameState(gameState);
  }
  @method draw() {
    this.getAndAssertEqualsState();
    const gameState = this.getGameState();
    this.verifySender(gameState);
    gameState.canDraw.assertTrue('draw not allowed');
    //UPDATE GAME STATE
    gameState.finalized = Field(GameState.FINALSTATES.DRAW);
    this.setGameState(gameState);
  }

  @method resign() {
    this.getAndAssertEqualsState();
    const gameState = this.getGameState();
    this.verifySender(gameState);
    gameState.finalized = Provable.if(
      gameState.turn,
      Field(GameState.FINALSTATES.BLACK_WON),
      Field(GameState.FINALSTATES.WHITE_WON)
    );
    this.setGameState(gameState);
  }
}
