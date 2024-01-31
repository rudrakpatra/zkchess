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
import { GameObject } from './GameLogic/GameLogic.js';
import { Move } from './Move/Move.js';
import { GameResult, GameState } from './GameState/GameState.js';

export class Chess extends SmartContract {
  @state(Field) gs0 = State<Field>();
  @state(Field) gs1 = State<Field>();
  @state(PublicKey) whiteKey = State<PublicKey>();
  @state(PublicKey) blackKey = State<PublicKey>();

  @method init() {
    super.init();
  }

  private assertSenderIsPlayer(gameState: GameState) {
    this.sender
      .equals(
        Provable.if(
          gameState.turn,
          this.whiteKey.getAndAssertEquals(),
          this.blackKey.getAndAssertEquals()
        )
      )
      .assertTrue('sender must be the player whose turn it is');
  }

  private setGameState(gameState: GameState) {
    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }
  public getGameState() {
    return GameState.fromEncoded([
      this.gs0.getAndAssertEquals(),
      this.gs1.getAndAssertEquals(),
    ]);
  }

  /**
   * starts a new game
   * @param whiteKey the public key of the player who plays white
   * @param blackKey the public key of the player who plays black
   * @param gameState the game state to start from
   */
  @method start(
    whiteKey: PublicKey,
    blackKey: PublicKey,
    gameState: GameState
  ) {
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
    this.setGameState(gameState);
  }
  @method move(move: Move) {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING))
      .assertTrue('game already over');

    const gameObject = new GameObject(gameState);
    gameObject.preMoveValidations(move).assertTrue('invalid move');
    const newGameState = gameObject.toUpdated(move);

    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        newGameState.white,
        newGameState.black,
        newGameState.turn,
        newGameState.enpassant,
        newGameState.kingCastled,
        newGameState.column,
        newGameState.halfmove,
        //newGameState.canDraw,
        Bool(false),
        // newGameState.result
        Provable.if(
          newGameState.black.getKing().captured,
          //WHITE WINS
          Field(GameResult.WHITE_WINS),
          Provable.if(
            newGameState.white.getKing().captured,
            //BLACK WINS
            Field(GameResult.BLACK_WINS),
            //else
            Field(GameResult.ONGOING)
          )
        )
      )
    );
  }

  // /**
  //  * offers a draw to the opponent
  //  */
  @method offerDraw() {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING))
      .assertTrue('game already over');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        // gameState.turn,
        gameState.turn.not(),
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(true),
        // gameState.result
        Field(GameResult.ONGOING_OFFERED_DRAW)
      )
    );
  }
  /**
   * resolve a draw offered by the opponent
   */
  @method resolveDraw(accept: Bool) {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING_OFFERED_DRAW))
      .assertTrue('no draw over');

    gameState.canDraw.assertTrue('resolving draw not allowed');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        // gameState.turn,
        gameState.turn.not(),
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // gameState.result
        Provable.if(accept, Field(GameResult.DRAW), Field(GameResult.ONGOING))
      )
    );
  }
  //CURRENTLY A PLAYER CAN CASTLE THROUGH A VULNERABLE POSITION
  /**
   * checks if the king castles through a vulnerable position
   * @param move the move that shows the king castled illegally
   */
  @method reportIllegalCastling(move: Move) {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING))
      .assertTrue('game already over');
    const gameObject = new GameObject(gameState);
    gameObject
      .illegalCastling(move)
      .assertTrue('false report of illegal castling');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        // gameState.turn,
        gameState.turn.not(),
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // gameState.result
        Provable.if(
          gameState.turn,
          //the reporting player simply wins the game
          Field(GameResult.WHITE_WINS),
          Field(GameResult.BLACK_WINS)
        )
      )
    );
  }

  //PROVING STALEMATE AS CURRENTLY A 3 STEP PROCESS
  //1. CLAIM STALEMATE
  //2. OPPONENT REPORTS FALSE STALEMATE CLAIM
  //3. DEFEND STALEMATE CLAIM

  /**
   * claim that the player has no valid moves left
   *
   * in case of a false claim, the opponent can report against it
   *
   * be mindful that the opponent can also choose to not report against it
   * which will result in a draw
   */
  @method claimStalemate() {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING))
      .assertTrue('game already over');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        // gameState.turn,
        gameState.turn.not(),
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // gameState.result
        Field(GameResult.ONGOING_AND_STALEMATE_CLAIMED)
      )
    );
  }

  @method acknowledgeStalemateClaim() {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING_AND_STALEMATE_CLAIMED))
      .assertTrue('stalemate claim not reported');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        gameState.turn.not(),
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // gameState.result
        Field(GameResult.DRAW_BY_STALEMATE)
      )
    );
  }

  @method overrideStalemateClaimByCapturingKing(move: Move) {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING_AND_STALEMATE_CLAIMED))
      .assertTrue('Stalemate must be claimed first');
    const gameObject = new GameObject(gameState);
    gameObject.preMoveValidations(move).assertTrue('invalid move');
    let newGameState = gameObject.toUpdated(move);
    newGameState.self().getKing().captured.assertTrue('invalid move');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        newGameState.white,
        newGameState.black,
        gameState.turn.not(),
        newGameState.enpassant,
        newGameState.kingCastled,
        newGameState.column,
        newGameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // gameState.result
        Provable.if(
          gameState.turn,
          Field(GameResult.WHITE_WINS),
          Field(GameResult.BLACK_WINS)
        )
      )
    );
  }
  /**
   * report a false stalemate claim by providing a valid move of the player claiming stalemate ; PLAYER A
   * on the other hand we have the prover ; PLAYER B
   * if PLAYER WANTS to disprove the stalemate claim, he must show a valid move of PLAYER A
   * @param move a move of the opponents that shows they have a valid move left
   */
  @method reportStalemateClaimByValidOpponentMove(move: Move) {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.ONGOING_AND_STALEMATE_CLAIMED))
      .assertTrue('Stalemate must be claimed first');
    //currently the prover is the other player,
    //he wants to play as the player who claimed stalemate
    //so skip a turn
    const skipATurn = GameState.from(
      gameState.white,
      gameState.black,
      // gameState.turn,
      gameState.turn.not(),
      gameState.enpassant,
      gameState.kingCastled,
      gameState.column,
      gameState.halfmove,
      gameState.canDraw,
      gameState.result
    );

    const gameObject = new GameObject(skipATurn);
    gameObject.preMoveValidations(move).assertTrue('invalid move');
    //the prover shows a move that is valid
    const newGameState = gameObject.toUpdated(move);
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        newGameState.white,
        newGameState.black,
        gameState.turn.not(),
        newGameState.enpassant,
        newGameState.kingCastled,
        newGameState.column,
        newGameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // gameState.result
        Field(GameResult.STALEMATE_CLAIM_REPORTED)
      )
    );
  }
  /**
   * defend your stalemate claim by providing how the opponent can capture my king
   *
   * following the reolveStalemateClaim method you are PLAYER A, and the opponent PLAYER B has shown a valid move
   *
   * your task is to show that this seemingly valid move is actually a move that captures your king
   *
   * so you skip a turn , and show how the opponent can capture your king
   *
   * @param move a move of the opponent that shows how they can capture my king
   */
  @method defendStalemateClaim(move: Move) {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.result
      .equals(Field(GameResult.STALEMATE_CLAIM_REPORTED))
      .assertTrue('stalemate claim not reported');

    //so skip a turn
    const skipATurn = GameState.from(
      gameState.white,
      gameState.black,
      // gameState.turn,
      gameState.turn.not(),
      gameState.enpassant,
      gameState.kingCastled,
      gameState.column,
      gameState.halfmove,
      gameState.canDraw,
      gameState.result
    );

    const gameObject = new GameObject(skipATurn);
    gameObject.preMoveValidations(move).assertTrue('invalid move');
    const newGameState = gameObject.toUpdated(move);
    //check if you have proved that the opponent can capture your king
    newGameState
      .self()
      .getKing()
      .captured.assertTrue('incorrect defence of claim');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        newGameState.white,
        newGameState.black,
        gameState.turn.not(),
        newGameState.enpassant,
        newGameState.kingCastled,
        newGameState.column,
        newGameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // newGameState.result
        Field(GameResult.DRAW_BY_STALEMATE)
      )
    );
  }
  /**
   * resigns the game and declares the opponent as the winner
   */
  @method resign() {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        gameState.turn.not(),
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        // gameState.result
        Provable.if(
          gameState.turn,
          Field(GameResult.BLACK_WINS),
          Field(GameResult.WHITE_WINS)
        )
      )
    );
  }
}
