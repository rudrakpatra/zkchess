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
import { GameObject } from './GameLogic/GameLogic';
import { Move } from './Move/Move';
import { GameState } from './GameState/GameState';

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
   */
  @method start(whiteKey: PublicKey, blackKey: PublicKey) {
    this.whiteKey.set(whiteKey);
    this.blackKey.set(blackKey);
    this.setGameState(GameState.fromFEN());
  }
  @method move(move: Move) {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    const gameObject = new GameObject(gameState);
    gameObject.assertPreMoveValidations(move);
    this.setGameState(gameObject.toUpdated(move));
  }

  /**
   * offers a draw to the opponent
   */
  @method offerDraw() {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        gameState.turn,
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(true),
        gameState.stalemateClaimed,
        gameState.finalized
      )
    );
  }
  /**
   * accepts a draw offered by the opponent
   */
  @method acceptDraw() {
    const gameState = this.getGameState();
    this.assertSenderIsPlayer(gameState);
    gameState.canDraw.assertTrue('draw not allowed');
    //UPDATE GAME STATE
    this.setGameState(
      GameState.from(
        gameState.white,
        gameState.black,
        gameState.turn,
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        gameState.stalemateClaimed,
        // gameState.finalized
        Field(GameState.FINALSTATES.DRAW)
      )
    );
  }

  /**
   * claim that the player has no valid moves left
   */
  @method claimStalemate() {
    //TODO
  }
  /**
   * report a false stalemate claim by providing a valid move
   */
  @method reportFalseStalemate() {
    //TODO
  }
  /**
   * checks if the king castles through a vulnerable position
   */
  @method reportIllegalCastling() {
    //TODO
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
        gameState.turn,
        gameState.enpassant,
        gameState.kingCastled,
        gameState.column,
        gameState.halfmove,
        //gameState.canDraw,
        Bool(false),
        gameState.stalemateClaimed,
        // gameState.finalized
        Provable.if(
          gameState.turn,
          Field(GameState.FINALSTATES.BLACK_WON),
          Field(GameState.FINALSTATES.WHITE_WON)
        )
      )
    );
  }
}
