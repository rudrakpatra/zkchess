import {
  SmartContract,
  method,
  Bool,
  Provable,
  PublicKey,
  Account,
  UInt64,
} from 'o1js';
import { GameResult } from '../GameState/GameState.js';
import { DEFAULT_PRECISION, calcEloChange } from '../EloRating/EloRating.js';
import { PvPChessProgramProof } from '../PvPChessProgram/PvPChessProgram.js';

const DEFAULT_RATING = 1200 * 10 ** DEFAULT_PRECISION;

export class ChessContract extends SmartContract {
  @method init() {
    super.init();
  }
  /**
   * Enable rankings for the sender
   * Throws error if already enabled
   */
  @method enableRankings() {
    const account = Account(this.sender, this.token.id);
    const balance = account.balance.getAndRequireEquals();
    balance.equals(UInt64.from(0)).assertTrue('Rankings already enabled');
    this.token.mint({
      address: this.sender,
      amount: UInt64.from(DEFAULT_RATING),
    });
  }
  @method submitMatchResult(proof: PvPChessProgramProof) {
    proof.verify();
    const result = proof.publicOutput.result;
    [
      GameResult.WHITE_WINS,
      GameResult.BLACK_WINS,
      GameResult.DRAW,
      GameResult.DRAW_BY_STALEMATE,
    ]
      .reduce(
        (acc, gameResult) => acc.or(result.equals(gameResult)),
        Bool(false)
      )
      .assertTrue('Invalid game result');

    const white = proof.publicInput.white;
    const black = proof.publicInput.black;
    const whiteRating = this.getPlayerRating(white);
    const blackRating = this.getPlayerRating(black);
    const whiteGreaterThanBlack = whiteRating.greaterThan(blackRating);
    const greaterRating = Provable.if(
      whiteGreaterThanBlack,
      whiteRating,
      blackRating
    );
    const lesserRating = Provable.if(
      whiteGreaterThanBlack,
      blackRating,
      whiteRating
    );
    const winner = Provable.if(
      result.equals(GameResult.WHITE_WINS),
      white,
      black
    );
    const loser = Provable.if(
      result.equals(GameResult.WHITE_WINS),
      black,
      white
    );
    const higher = Provable.if(whiteGreaterThanBlack, white, black);
    const lower = Provable.if(whiteGreaterThanBlack, black, white);

    const eloDiff = greaterRating.sub(lesserRating);
    const ratingChange = calcEloChange(
      eloDiff.toFields()[0],
      true
    ).toFields()[0];

    const draw = [
      result.equals(GameResult.DRAW),
      result.equals(GameResult.DRAW_BY_STALEMATE),
    ].reduce(Bool.or);
    const amount = Provable.if(
      draw,
      UInt64.from(ratingChange).div(2),
      UInt64.from(ratingChange)
    );
    const minter = Provable.if(draw, lower, winner);
    const burner = Provable.if(draw, higher, loser);

    this.token.mint({ address: minter, amount });
    this.token.burn({ address: burner, amount });
  }
  public getPlayerRating(address: PublicKey) {
    const account = Account(address, this.token.id);
    return account.balance.getAndRequireEquals();
  }
}
