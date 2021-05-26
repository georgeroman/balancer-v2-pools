import BigNumber, { bn } from "../utils/big-number";
import * as fp from "../utils/math/fixed-point";
import { PoolType, SwapType } from "./base-types";

export default abstract class BasePool {
  private MIN_TOKENS = 2;
  private MAX_TOKENS = 8;

  // 1e18 corresponds to 1.0, or a 100% fee
  private MIN_SWAP_FEE_PERCENTAGE = bn("1000000000000"); // 0.0001%
  private MAX_SWAP_FEE_PERCENTAGE = bn("100000000000000000"); // 10%

  private _poolId: string;
  private _poolType: PoolType;
  private _tokens: string[];
  private _swapFeePercentage: BigNumber;

  get poolId() {
    return this._poolId;
  }

  get poolType() {
    return this._poolType;
  }

  get swapFeePercentage() {
    return this._swapFeePercentage;
  }

  constructor(
    poolId: string,
    poolType: PoolType,
    tokens: string[],
    swapFeePercentage: BigNumber
  ) {
    // TODO: Add more checks for the number of tokens based on the pool type

    if (tokens.length < this.MIN_TOKENS) {
      throw new Error("MIN_TOKENS");
    }
    if (tokens.length > this.MAX_TOKENS) {
      throw new Error("MAX_TOKENS");
    }

    this._poolId = poolId;
    this._poolType = poolType;
    this._tokens = tokens;
    this.setSwapFeePercentage(swapFeePercentage);
  }

  public setSwapFeePercentage(swapFeePercentage: BigNumber) {
    if (swapFeePercentage.lt(this.MIN_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MIN_SWAP_FEE_PERCENTAGE");
    }
    if (swapFeePercentage.gt(this.MAX_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MAX_SWAP_FEE_PERCENTAGE");
    }

    this._swapFeePercentage = swapFeePercentage;
  }

  public swap(
    swapType: SwapType,
    tokenIn: string,
    tokenOut: string,
    amount: BigNumber,
    limit: BigNumber
  ): BigNumber {
    // TODO: Take into account multiple pool specializations

    if (this._tokens.indexOf(tokenIn) === -1) {
      throw new Error("Invalid token in");
    }
    if (this._tokens.indexOf(tokenOut) === -1) {
      throw new Error("Invalid token out");
    }

    if (tokenIn === tokenOut) {
      throw new Error("CANNOT_SWAP_SAME_TOKEN");
    }

    if (swapType === SwapType.GivenIn) {
      // This returns amount - fee amount, so we round up (favoring a higher fee amount)
      amount = fp.sub(amount, fp.mulUp(amount, this.swapFeePercentage));

      const amountOut = this._onSwapGivenIn(tokenIn, tokenOut, amount);
      if (amountOut.lt(limit)) {
        throw new Error("SWAP_LIMIT");
      }

      return amountOut;
    } else {
      const amountIn = this._onSwapGivenOut(tokenIn, tokenOut, amount);
      if (amountIn.gt(limit)) {
        throw new Error("SWAP_LIMIT");
      }

      // This returns amount + fee amount, so we round up (favoring a higher fee amount)
      return fp.divUp(amountIn, fp.complement(this.swapFeePercentage));
    }
  }

  protected abstract _onSwapGivenIn(
    tokenIn: string,
    tokenOut: string,
    amount: BigNumber
  ): BigNumber;

  protected abstract _onSwapGivenOut(
    tokenIn: string,
    tokenOut: string,
    amount: BigNumber
  ): BigNumber;
}
