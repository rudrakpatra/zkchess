import { Field, Bool, Struct, Provable, Scalar } from 'o1js';

import { Piece } from '../Piece/Piece';
import { Position } from '../Position/Position';
import { RANK, RankAsChar } from '../Piece/Rank';
import { pack, unpack } from '../Packer';
import { PlayerState } from './PlayerState/PlayerState';
import { Move } from '../Move/Move';
import { Board } from '../Board/Boards';

export const defaultFEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class GameState extends Struct({
  white: PlayerState,
  black: PlayerState,
  turn: Bool,
  enpassant: Bool,
  enpassantColumn: Field,
  halfmove: Field,
  canDraw: Bool,
  finalized: Field,
}) {
  static from(
    white: PlayerState,
    black: PlayerState,
    turn: Bool,
    enpassant: Bool,
    enpassantColumn: Field,
    halfmove: Field,
    canDraw: Bool,
    finalized: Field
  ): GameState {
    return new GameState({
      white,
      black,
      turn,
      enpassant,
      enpassantColumn: enpassantColumn,
      halfmove,
      canDraw,
      finalized,
    });
  }
  static FINALSTATES = {
    ONGOING: 0,
    WHITE_WON: 1,
    BLACK_WON: 2,
    DRAW: 3,
  };
  static ENCODING_SCHEME = [162, 162, 1, 1, 3, 8, 1, 2];
  /**
   *
   * @param state 162|162|1|1|3|8|1|2 = 340 bits
   * @returns
   */
  static fromEncoded(fields: Field[]): GameState {
    const [
      whiteBits,
      blackBits,
      turnBit,
      enpassantBits,
      enpassantColumnBits,
      halfmoveBits,
      canDrawBit,
      finalizedBits,
    ] = unpack(fields, GameState.ENCODING_SCHEME);

    const white = PlayerState.fromEncoded([whiteBits]);
    const black = PlayerState.fromEncoded([blackBits]);
    const turn = Bool.fromFields([turnBit]);
    const enpassant = Bool.fromFields([enpassantBits]);
    const enpassantColumn = Field.fromFields([enpassantColumnBits]);
    const halfmove = Field.fromFields([halfmoveBits]);
    const canDraw = Bool.fromFields([canDrawBit]);
    const finalized = Field.fromFields([finalizedBits]);
    return GameState.from(
      white,
      black,
      turn,
      enpassant,
      enpassantColumn,
      halfmove,
      canDraw,
      finalized
    );
  }

  public encode(): Field[] {
    return pack(
      [
        ...this.white.encode(),
        ...this.black.encode(),
        ...this.turn.toFields(),
        ...this.enpassant.toFields(),
        ...this.enpassantColumn.toFields(),
        ...this.halfmove.toFields(),
        ...this.canDraw.toFields(),
      ],
      GameState.ENCODING_SCHEME
    );
  }
  static fromFEN(FEN: string = defaultFEN): GameState {
    let [pieces, turn, castling, enpassant, half, full] = FEN.split(' ');
    let white = {
      pieces: [] as Piece[],
      castling: {
        kingSide: Bool(castling.includes('K')),
        queenSide: Bool(castling.includes('Q')),
      },
    };
    let black = {
      pieces: [] as Piece[],
      castling: {
        kingSide: Bool(castling.includes('k')),
        queenSide: Bool(castling.includes('q')),
      },
    };
    pieces.split('/').forEach((row, x) => {
      //expande number to dots
      const expanded = row.replace(/[1-8]/g, (m) => '.'.repeat(Number(m)));
      const chars = expanded.split('');
      chars.forEach((char, y) => {
        if (char == '.') return;
        const position = Position.from(Field.from(x), Field.from(y));
        const captured = Bool(false);
        const rank = Field(RANK.from.char[char.toLowerCase() as RankAsChar]);
        const piece = Piece.from(position, captured, rank);
        char == char.toUpperCase()
          ? white.pieces.push(piece)
          : black.pieces.push(piece);
      });
    });
    const column = Math.max(0, enpassant.charCodeAt(0) - 97);
    return GameState.from(
      PlayerState.from(white.pieces, white.castling),
      PlayerState.from(black.pieces, black.castling),
      Bool(turn.includes('w')),
      Bool(enpassant !== '-'),
      Field(column),
      Field(Number(half)),
      Bool(false),
      Field(GameState.FINALSTATES.ONGOING)
    );
  }
  public toFEN() {
    let pieces: string[][] = [];
    for (let i = 0; i < 8; i++) {
      pieces.push([]);
      for (let j = 0; j < 8; j++) {
        pieces[i].push('.');
      }
    }
    this.white.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const row = Number(p.position.row.toString());
        const col = Number(p.position.col.toString());
        pieces[row][col] = RANK.to.char(p.rank.toBigInt()).toUpperCase();
      }
    });
    this.black.pieces.forEach((p) => {
      if (p.captured.toString() === 'false') {
        const row = Number(p.position.row.toString());
        const col = Number(p.position.col.toString());
        pieces[row][col] = RANK.to.char(p.rank.toBigInt()).toLowerCase();
      }
    });
    const board = pieces
      .map((row) => row.join('').replace(/\.+/g, (m) => m.length.toString()))
      .join('/');

    const turn = this.turn.toString() === 'true' ? 'w' : 'b';
    const castling =
      '' +
      (this.white.castling.kingSide.toString() === 'true' ? 'K' : '') +
      (this.white.castling.queenSide.toString() === 'true' ? 'Q' : '') +
      (this.black.castling.kingSide.toString() === 'true' ? 'k' : '') +
      (this.black.castling.queenSide.toString() === 'true' ? 'q' : '');
    //enpassant
    const enpassantVal =
      String.fromCharCode(Number(this.enpassantColumn.toString()) + 97) +
      (turn === 'w' ? 6 : 3);
    const enpassant = this.enpassant.toString() === 'true' ? enpassantVal : '-';

    const halfmove = this.halfmove.toString();
    return `${board} ${turn} ${castling} ${enpassant} ${halfmove} 1`;
  }
  private self() {
    return Provable.if(this.turn, this.white, this.black);
  }
  private opponent() {
    return Provable.if(this.turn, this.black, this.white);
  }
  private isUncapturedPieceAt(position: Position) {
    return [
      this.white.isUncapturedPieceAt(position),
      this.black.isUncapturedPieceAt(position),
    ].reduce(Bool.or);
  }
  /**
   * used to compute moves of pieces that moves along a ray
   * the ray consists of a series of positions
   * @param origin the origin of the ray
   * @param delta the ray marching direction
   * @returns
   */
  private getMovesfromRay(origin: Position, delta: Position) {
    const ray = Array(8).map((_, i) => {
      const row = origin.row.add(delta.row.mul(i));
      const col = origin.col.add(delta.col.mul(i));
      return Position.from(row, col);
    });
    const march1 = Bool(true);
    const march2 = this.isUncapturedPieceAt(ray[1]).not();
    const march3 = this.isUncapturedPieceAt(ray[2]).not().and(march2);
    const march4 = this.isUncapturedPieceAt(ray[3]).not().and(march3);
    const march5 = this.isUncapturedPieceAt(ray[4]).not().and(march4);
    const march6 = this.isUncapturedPieceAt(ray[5]).not().and(march5);
    const march7 = this.isUncapturedPieceAt(ray[6]).not().and(march6);
    return [
      Move.from(origin, ray[1], march1),
      Move.from(origin, ray[2], march2),
      Move.from(origin, ray[3], march3),
      Move.from(origin, ray[4], march4),
      Move.from(origin, ray[5], march5),
      Move.from(origin, ray[6], march6),
      Move.from(origin, ray[7], march7),
    ];
  }
  //moves
  private right(position: Position) {
    return this.getMovesfromRay(position, Position.from(0, 1));
  }
  private left(position: Position) {
    return this.getMovesfromRay(position, Position.from(0, -1));
  }
  private up(position: Position) {
    return this.getMovesfromRay(position, Position.from(-1, 0));
  }
  private down(position: Position) {
    return this.getMovesfromRay(position, Position.from(1, 0));
  }
  private diagonals(position: Position) {
    return [
      this.getMovesfromRay(position, Position.from(1, 1)),
      this.getMovesfromRay(position, Position.from(1, -1)),
      this.getMovesfromRay(position, Position.from(-1, 1)),
      this.getMovesfromRay(position, Position.from(-1, -1)),
    ];
  }
  /**
   * @returns generates all possible moves for the current player.
   *
   * **Warning**: This function does not check if the king is in check.
   *
   */
  private generateValidMovesWithoutChecks(): Move[] {
    const self = this.self();
    //for each piece
    return self.pieces.flatMap(({ rank, position, captured }) => {
      //generate all possible moves
      return (
        [
          [this.PAWN(position), RANK.from.name.PAWN],
          [this.KNIGHT(position), RANK.from.name.KNIGHT],
          [this.BISHOP(position), RANK.from.name.BISHOP],
          [this.ROOK(position), RANK.from.name.ROOK],
          [this.QUEEN(position), RANK.from.name.QUEEN],
          [this.KING(position), RANK.from.name.KING],
        ] as Array<[Move[], number]>
      )
        .flatMap(([moves, rankToMatch]) =>
          moves.map((m) => Move.addCondition(m, rank.equals(rankToMatch)))
        )
        .map((m) =>
          [
            //piece must not be captured
            captured.not(),
            //piece must not capture own piece
            self.isUncapturedPieceAt(m.to).not(),
            //piece does not move out of the board
            Board.bounds(m.to),
          ].reduce(Move.addCondition, m)
        );
    });
  }
  /**
   * a move is invalid the king could be captured:
   *
   * 1. after the move
   *
   * 2. while castling
   *
   * @param move the move after which we check these conditions
   * @returns whether the move obeys these conditions
   */
  private isKingSafe(move: Move) {
    const self = this.self();
    const opponent = this.opponent();

    //minimal conditions for detecting events
    const castlingRow = Provable.if(this.turn, Field(7), Field(0));
    const castlingOccured = {
      kingSide: [
        //minimal conditions to be a king side castling move
        move.from.equals(Position.from(castlingRow, 4)),
        move.to.equals(Position.from(castlingRow, 6)),
      ].reduce(Bool.and),
      queenSide: [
        //minimal conditions to be a queen side castling move
        move.from.equals(Position.from(castlingRow, 4)),
        move.to.equals(Position.from(castlingRow, 2)),
      ].reduce(Bool.and),
    };

    const myPiece = self.checkAndGetUncapturedPieceAt(move.from);

    const pawnCapturedUsingEnpassant = [
      //minimal conditions to be a pawn capture using enpassant
      myPiece.rank.equals(RANK.from.name.PAWN),
      //moves to different column
      move.from.col.equals(this.enpassantColumn).not(),
      //there is no piece at the destination
      opponent.isUncapturedPieceAt(move.to).not(),
    ].reduce(Bool.and);

    //the row where the pawn moved to by 2 squares
    const enpassantRow = Provable.if(this.turn, Field(2), Field(5));

    const newSelf = PlayerState.from(
      self.pieces.map(({ position, captured, rank }) => {
        //normal move
        let newPosition = Provable.if(
          //current piece is the one to be moved
          position.equals(move.from),
          move.to,
          position
        );

        //move the king side rook move when castling
        newPosition = Provable.if(
          castlingOccured.kingSide.and(
            //current piece is king side rook
            position.equals(Position.from(castlingRow, 7))
          ),
          Position.from(castlingRow, 5),
          position
        );

        //queen side rook move when castling
        newPosition = Provable.if(
          castlingOccured.queenSide.and(
            //current piece is queen side rook
            position.equals(Position.from(castlingRow, 0))
          ),
          Position.from(castlingRow, 3),
          position
        );

        let newCaptured = captured;
        let newRank = rank;

        return Piece.from(newPosition, newCaptured, newRank);
      }),
      {
        //castling rights
        kingSide: Provable.if(
          castlingOccured.kingSide,
          Bool(false), // remove castling rights
          self.castling.kingSide // propagate last state
        ),
        queenSide: Provable.if(
          castlingOccured.queenSide,
          Bool(false), // remove castling rights
          self.castling.queenSide // propagate last state
        ),
      }
    );
    const newOpponent = PlayerState.from(
      opponent.pieces.map(({ position, captured, rank }) => {
        let newPosition = position;

        let newCaptured = [
          //already captured or not
          captured,
          //captured by normal move
          position.equals(move.to),
          //enpassant pawn captured by pawn
          pawnCapturedUsingEnpassant.and(
            //piece is the enpassant pawn
            position.equals(Position.from(enpassantRow, this.enpassantColumn))
          ),
        ].reduce(Bool.or);

        let newRank = rank;
        return Piece.from(newPosition, newCaptured, newRank);
      }),
      opponent.castling
    );
    const newWhite = Provable.if(this.turn, newSelf, newOpponent);
    const newBlack = Provable.if(this.turn, newOpponent, newSelf);
    const newTurn = this.turn.not();
    const newEnpassant = pawnCapturedUsingEnpassant;
    const newEnpassantColumn = move.to.col;
    const nextState = GameState.from(
      newWhite,
      newBlack,
      newTurn,
      newEnpassant,
      newEnpassantColumn,
      //rest can be copied
      this.halfmove,
      this.canDraw,
      this.finalized
    );
    //check if opponent can capture my king

    // note that on the next turn self becomes opponent
    const myKing = newOpponent.getKing();
    return nextState
      .generateValidMovesWithoutChecks()
      .map((m) =>
        [
          //can capture king
          m.to.equals(myKing.position),
          //could capture king while king side castling
          castlingOccured.kingSide.and(
            m.to.equals(Position.from(castlingRow, 6))
          ),
          //could capture king while queen side castling
          castlingOccured.queenSide.and(
            m.to.equals(Position.from(castlingRow, 2))
          ),
        ].reduce(Bool.or)
      )
      .reduce(Bool.or)
      .not();
  }
  /**
   * @returns whether the king is currently in check
   */
  private isKingInCheck() {
    //the player skips turn
    const nextState = GameState.from(
      this.white,
      this.black,
      this.turn.not(), //update turn
      //these dont matter
      this.enpassant,
      this.enpassantColumn,
      this.halfmove,
      this.canDraw,
      this.finalized
    );
    //can the opponent now capture my king?
    //note that on the next turn self becomes opponent
    const myKing = nextState.opponent().getKing();
    return nextState
      .generateValidMovesWithoutChecks()
      .map((m) => {
        return m.to.equals(myKing.position);
      })
      .reduce(Bool.or);
  }

  // piece-wise moves
  /**
   * generates :
   * - one square forward
   * - two squares forward
   * - captures forward left
   * - captures forward right
   * - captures enpassant left
   * - captures enpassant right
   * @param position
   * @returns
   */
  private PAWN(position: Position) {
    const enpassantRow = Provable.if(this.turn, Field(2), Field(5));
    const startingRow = Provable.if(this.turn, Field(6), Field(1));
    const forward = Provable.if(this.turn, Field(-1), Field(1));
    const opponent = this.opponent();
    const oneSquareForward = Position.from(
      position.row.add(forward),
      position.col
    );
    const twoSquaresForward = Position.from(
      position.row.add(forward.mul(2)),
      position.col
    );
    const forwardleft = Position.from(
      position.row.add(forward),
      position.col.sub(1)
    );
    const forwardright = Position.from(
      position.row.add(forward),
      position.col.add(1)
    );
    return [
      //movesOneSquareForward
      Move.from(
        position,
        oneSquareForward,
        this.isUncapturedPieceAt(oneSquareForward).not()
      ),
      //movesTwoSquaresForward
      Move.from(
        position,
        twoSquaresForward,
        [
          position.row.equals(startingRow),
          this.isUncapturedPieceAt(oneSquareForward).not(),
          this.isUncapturedPieceAt(twoSquaresForward).not(),
        ].reduce(Bool.and)
      ),
      //capturesForwardLeft
      Move.from(
        position,
        Position.from(position.row.add(forward), position.col.sub(1)),
        opponent.isUncapturedPieceAt(forwardleft)
      ),
      //capturesForwardRight
      Move.from(
        position,
        Position.from(position.row.add(forward), position.col.add(1)),
        opponent.isUncapturedPieceAt(forwardright)
      ),
      //capturesEnpassantLeft
      Move.from(
        position,
        forwardleft,
        [
          this.enpassant,
          forwardleft.row.equals(enpassantRow),
          forwardleft.col.equals(this.enpassantColumn),
        ].reduce(Bool.and)
      ),
      //capturesEnpassantRight
      Move.from(
        position,
        forwardright,
        [
          this.enpassant,
          forwardright.row.equals(enpassantRow),
          forwardright.col.equals(this.enpassantColumn),
        ].reduce(Bool.and)
      ),
    ];
  }
  /**
   * generates :
   * - all L-shaped moves
   * @param position
   * @returns
   */
  private KNIGHT(position: Position) {
    //prettier-ignore
    const squares=[
              [-2, -1],        [-2,  1],
      [-1, -2],                         [-1,  2],
      
      [ 1, -2],                         [ 1,  2],
              [ 2, -1],        [ 2,  1],
    ]

    return squares.map(([row, col]) =>
      Move.from(
        position,
        Position.from(position.row.add(row), position.col.add(col)),
        Bool(true)
      )
    );
  }
  /**
   * generates :
   * - all diagonal moves
   * @param from
   * @returns
   */
  private BISHOP(from: Position) {
    return this.diagonals(from).flat();
  }
  /**
   * generates :
   * - all horizontal moves
   * - all vertical moves
   * @param from
   * @returns
   */
  private ROOK(from: Position) {
    return [
      ...this.right(from),
      ...this.left(from),
      ...this.up(from),
      ...this.down(from),
    ];
  }
  /**
   * generates :
   * - all bishop moves
   * - all rook moves
   * @param from
   * @returns
   */
  private QUEEN(from: Position) {
    return [...this.BISHOP(from), ...this.ROOK(from)];
  }
  /**
   * generates:
   * - one square in any direction
   * - castling
   *
   * **Warning**: This function does not check if the king is in check.
   * @param from
   * @returns
   */
  private KING(from: Position) {
    //prettier-ignore
    const squares = [
      [-1, 1],[-1, 0],[-1, -1],
      [ 0, 1],        [ 0, -1],
      [ 1, 1],[ 1, 0],[ 1, -1],
    ];

    const castlingRights = this.self().castling;
    const startingRow = Provable.if(this.turn, Field(7), Field(0));
    const queenSidePassageIsClear = [
      this.isUncapturedPieceAt(Position.from(startingRow, 1)).not(),
      this.isUncapturedPieceAt(Position.from(startingRow, 2)).not(),
      this.isUncapturedPieceAt(Position.from(startingRow, 3)).not(),
    ].reduce(Bool.and);

    const kingSidePassageIsClear = [
      this.isUncapturedPieceAt(Position.from(startingRow, 5)).not(),
      this.isUncapturedPieceAt(Position.from(startingRow, 6)).not(),
    ].reduce(Bool.and);
    return [
      ...squares
        .map(([row, col]) =>
          Position.from(from.row.add(row), from.col.add(col))
        )
        .map((to) => Move.from(from, to, Bool(true))),
      //king side castling
      Move.from(
        from,
        Position.from(from.row, from.col.add(2)),
        [castlingRights.kingSide, kingSidePassageIsClear].reduce(Bool.and)
      ),
      //queen side castling
      Move.from(
        from,
        Position.from(from.row, from.col.sub(2)),
        [castlingRights.queenSide, queenSidePassageIsClear].reduce(Bool.and)
      ),
    ];
  }

  /**
   * assert if a move is valid by
   *
   * 1.checking that the move can be generated from the current state
   *
   * 2.that the king is safe during this move
   *
   * @param move
   * @returns
   */
  public assertMoveIsValid(move: Move) {
    //we assert a move is valid if
    return this.generateValidMovesWithoutChecks()
      .map((m) =>
        //that move is listed as
        m.equals(move).and(
          //valid
          m.valid.and(
            //that keeps the king safe
            this.isKingSafe(m)
          )
        )
      )
      .reduce(Bool.or)
      .assertTrue('invalid move');
  }
  public assertPromotionIsValid(promotion: Field) {
    return [
      //promotion rank is valid
      promotion.equals(RANK.from.name.QUEEN),
      promotion.equals(RANK.from.name.ROOK),
      promotion.equals(RANK.from.name.BISHOP),
      promotion.equals(RANK.from.name.KNIGHT),
    ]
      .reduce(Bool.or)
      .assertTrue('invalid promotion');
  }
  /**
   * handles all updates to state after a move is made
   * @param move
   * @param promotion
   * @returns a new game state after the move is made
   */
  public toUpdated(move: Move, promotion: Field) {
    const self = this.self();
    const opponent = this.opponent();

    //minimal conditions for detecting events
    const castlingRow = Provable.if(this.turn, Field(7), Field(0));
    const castlingOccured = {
      kingSide: [
        //minimal conditions to be a king side castling move
        move.from.equals(Position.from(castlingRow, 4)),
        move.to.equals(Position.from(castlingRow, 6)),
      ].reduce(Bool.and),
      queenSide: [
        //minimal conditions to be a queen side castling move
        move.from.equals(Position.from(castlingRow, 4)),
        move.to.equals(Position.from(castlingRow, 2)),
      ].reduce(Bool.and),
    };

    const promotionRow = Provable.if(this.turn, Field(0), Field(7));

    const myPiece = self.checkAndGetUncapturedPieceAt(move.from);

    const pawnCapturedUsingEnpassant = [
      //minimal conditions to be a pawn capture using enpassant
      myPiece.rank.equals(RANK.from.name.PAWN),
      //moves to different column
      move.from.col.equals(this.enpassantColumn).not(),
      //there is no piece at the destination
      opponent.isUncapturedPieceAt(move.to).not(),
    ].reduce(Bool.and);

    const pawnMovedTwoSquares = [
      //minimal conditions to be a pawn move two squares
      myPiece.rank.equals(RANK.from.name.PAWN),
      //moves two squares
      move.from.distanceSquared(move.to).equals(Field(4)),
    ].reduce(Bool.and);

    const gameAdvances = [
      //conditions to advance the game
      //pawn has moved
      myPiece.rank.equals(RANK.from.name.PAWN),
      //piece captured
      opponent.isUncapturedPieceAt(move.to),
    ].reduce(Bool.or);
    //the row where the pawn moved to by 2 squares
    const enpassantRow = Provable.if(this.turn, Field(2), Field(5));

    const newSelf = PlayerState.from(
      self.pieces.map(({ position, captured, rank }) => {
        //normal move
        let newPosition = Provable.if(
          //current piece is the one to be moved
          position.equals(move.from),
          move.to,
          position
        );

        //move the king side rook move when castling
        newPosition = Provable.if(
          castlingOccured.kingSide.and(
            //current piece is king side rook
            position.equals(Position.from(castlingRow, 7))
          ),
          Position.from(castlingRow, 5),
          position
        );

        //queen side rook move when castling
        newPosition = Provable.if(
          castlingOccured.queenSide.and(
            //current piece is queen side rook
            position.equals(Position.from(castlingRow, 0))
          ),
          Position.from(castlingRow, 3),
          position
        );

        let newCaptured = captured;

        let newRank = Provable.if(
          [
            //current piece that is the one to be moved
            position.equals(move.from),
            //current piece is a pawn
            rank.equals(RANK.from.name.PAWN),
            //current piece reached promotion row
            move.to.row.equals(promotionRow),
          ].reduce(Bool.and),
          promotion,
          rank
        );
        return Piece.from(newPosition, newCaptured, newRank);
      }),
      {
        //castling rights
        kingSide: Provable.if(
          castlingOccured.kingSide,
          Bool(false), // remove castling rights
          self.castling.kingSide // propagate last state
        ),
        queenSide: Provable.if(
          castlingOccured.queenSide,
          Bool(false), // remove castling rights
          self.castling.queenSide // propagate last state
        ),
      }
    );
    const newOpponent = PlayerState.from(
      opponent.pieces.map(({ position, captured, rank }) => {
        let newPosition = position;

        let newCaptured = [
          //already captured or not
          captured,
          //captured by normal move
          position.equals(move.to),
          //enpassant pawn captured by pawn
          pawnCapturedUsingEnpassant.and(
            //piece is the enpassant pawn
            position.equals(Position.from(enpassantRow, this.enpassantColumn))
          ),
        ].reduce(Bool.or);

        let newRank = rank;
        return Piece.from(newPosition, newCaptured, newRank);
      }),
      opponent.castling
    );

    //create next game state
    const newWhite = Provable.if(this.turn, newSelf, newOpponent);
    const newBlack = Provable.if(this.turn, newOpponent, newSelf);
    const newTurn = this.turn.not();
    const newEnpassant = pawnMovedTwoSquares;
    const newEnpassantColumn = move.to.col;
    const newHalfmove = Provable.if(
      gameAdvances,
      Field(0),
      this.halfmove.add(Field(1))
    );

    const newCanDraw = [
      //can draw by 50 moves rule
      this.halfmove.equals(Field(100)),
      //can draw by threefold repetition
    ].reduce(Bool.or);

    let newFinalized = Provable.if(
      //force draw by 75 moves rule
      this.halfmove.equals(Field(150)),
      Field(GameState.FINALSTATES.DRAW),
      Field(GameState.FINALSTATES.ONGOING)
    );
    //override with fivefold repetition
    //NOT IN PLAN

    //override with insufficient material
    //NOT IN PLAN

    //override with stalemate
    newFinalized = Provable.if(
      //if we find any
      this.generateValidMovesWithoutChecks()
        .map((m) =>
          //valid move
          m.valid.and(
            //that keeps the king safe
            this.isKingSafe(m)
          )
        )
        .reduce(Bool.or),
      //then the game is ongoing
      Field(GameState.FINALSTATES.ONGOING),
      //no valid moves left
      Provable.if(
        //king is in check
        this.isKingInCheck(),
        //then the game is a checkmate
        Provable.if(
          this.turn,
          //white lost
          Field(GameState.FINALSTATES.BLACK_WON),
          //black lost
          Field(GameState.FINALSTATES.WHITE_WON)
        ),
        //otherwise the game is a stalemate
        Field(GameState.FINALSTATES.DRAW)
      )
    );
    return GameState.from(
      newWhite,
      newBlack,
      newTurn,
      newEnpassant,
      newEnpassantColumn,
      newHalfmove,
      newCanDraw,
      newFinalized
    );
  }
}
