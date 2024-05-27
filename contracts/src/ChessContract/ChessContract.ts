import {
  SmartContract,
  method,
  Bool,
  Provable,
  PublicKey,
  Account,
  UInt64,
  TokenContract,
  AccountUpdateForest,
  AccountUpdate,
  Permissions,
  DeployArgs,
} from 'o1js';
import { GameResult } from '../GameState/GameState.js';
import { DEFAULT_DECIMALS, calcEloChange } from '../EloRating/EloRating.js';
import { PvPChessProgramProof } from '../PvPChessProgram/PvPChessProgram.js';

const DEFAULT_RATING = 1200 * 10 ** DEFAULT_DECIMALS;

export class ChessContract extends TokenContract {
  @method async init() {
    super.init();
  }
  public async approveBase(forest: AccountUpdateForest) {
    this.checkZeroBalanceChange(forest);
  }
  async deploy(args?: DeployArgs) {
    await super.deploy(args);
    this.account.tokenSymbol.set('ELO');

    // make account non-upgradable forever
    this.account.permissions.set({
      ...Permissions.default(),
      access: Permissions.proof(),
    });
  }

  /**
   * Enable rankings for the sender
   * Throws error if already enabled
   */
  @method async enableRankings() {
    const sender = this.sender.getAndRequireSignature();
    this.getPlayerRating(sender)
      .equals(UInt64.from(0))
      .assertTrue('Rankings already enabled');
    this.internal.mint({
      address: sender,
      amount: UInt64.from(DEFAULT_RATING),
    });
  }
  @method async submitMatchResult(proof: PvPChessProgramProof) {
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

    const white = proof.publicInput.whiteUser;
    const black = proof.publicInput.blackUser;
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
      UInt64.Unsafe.fromField(ratingChange).div(2),
      UInt64.Unsafe.fromField(ratingChange)
    );
    const minter = Provable.if(draw, lower, winner);
    const burner = Provable.if(draw, higher, loser);

    this.internal.mint({ address: minter, amount });
    this.internal.mint({ address: burner, amount });
  }
  public getPlayerRating(address: PublicKey) {
    const tokenId = this.deriveTokenId();
    return AccountUpdate.create(
      address,
      tokenId
    ).account.balance.getAndRequireEquals();
  }
}
