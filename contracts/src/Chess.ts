import {
  Field,
  SmartContract,
  method,
  state,
  State,
  Provable,
  PublicKey,
} from 'o1js';

import { GameState } from './GameState/GameState';
import { Move } from './Move/Move';

export class Chess extends SmartContract {
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

  private getAndAssertEqualsState() {
    this.gs0.getAndAssertEquals();
    this.gs1.getAndAssertEquals();
    this.whiteKey.getAndAssertEquals();
    this.blackKey.getAndAssertEquals();
  }
  private verifySender(gameState: GameState) {
    this.sender
      .equals(
        Provable.if(gameState.turn, this.whiteKey.get(), this.blackKey.get())
      )
      .assertTrue('sender must be the player whose turn it is');
  }
  public getGameState() {
    return GameState.fromEncoded([this.gs0.get(), this.gs1.get()]);
  }
  private setGameState(gameState: GameState) {
    let [a, b] = gameState.encode();
    this.gs0.set(a);
    this.gs1.set(b);
  }

  @method move(move: Move, promotion: Field) {
    this.getAndAssertEqualsState();
    const gameState = this.getGameState();
    this.verifySender(gameState);
    gameState.assertMoveIsValid(move);
    gameState.assertPromotionIsValid(promotion);
    this.setGameState(gameState.toUpdated(move, promotion));
  }
  @method draw() {
    this.getAndAssertEqualsState();
    const gameState = this.getGameState();
    this.verifySender(gameState);
    gameState.canDraw.assertTrue('draw not allowed');
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
