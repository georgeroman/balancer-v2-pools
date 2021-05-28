import BigNumber, { bn, scale } from "../../utils/big-number";

import * as fp from "../../utils/math/fixed-point";
import * as math from "./math";

export interface IWeightedPoolToken {
  name: string;
  balance: string;
  decimals: number;
  weight: BigNumber;
}

export interface IWeightedPoolParams {
  name: string;
  tokens: IWeightedPoolToken[];
  totalBptAmount: string;
  swapFeePercentage: string;
}

export default class WeightedPool {
  private MIN_TOKENS = 2;
  private MAX_TOKENS = 8;

  private MIN_SWAP_FEE_PERCENTAGE = bn("0.000001"); // 0.0001%
  private MAX_SWAP_FEE_PERCENTAGE = bn("0.1"); // 10%

  // A minimum normalized weight imposes a maximum weight ratio
  // We need this due to limitations in the implementation of the power function, as these ratios are often exponents
  private MIN_WEIGHT = bn("0.01"); // 0.01e18

  private _name: string;
  private _tokens: IWeightedPoolToken[];
  private _totalBptAmount: string;
  private _swapFeePercentage: string;

  get name() {
    return this._name;
  }

  get tokens() {
    return this._tokens;
  }

  get swapFeePercentage() {
    return this._swapFeePercentage;
  }

  get totalBptAmount() {
    return this._totalBptAmount;
  }

  constructor(params: IWeightedPoolParams) {
    if (params.tokens.length < this.MIN_TOKENS) {
      throw new Error("MIN_TOKENS");
    }
    if (params.tokens.length > this.MAX_TOKENS) {
      throw new Error("MAX_TOKENS");
    }

    this._name = params.name;
    this._tokens = params.tokens;
    this._totalBptAmount = params.totalBptAmount;
    this.setSwapFeePercentage(params.swapFeePercentage);

    let normalizedSum = bn(0);
    for (let i = 0; i < params.tokens.length; i++) {
      if (bn(params.tokens[i].weight).lt(this.MIN_WEIGHT)) {
        throw new Error("MIN_WEIGHT");
      }
      normalizedSum = normalizedSum.plus(params.tokens[i].weight);
    }

    if (!normalizedSum.eq(1)) {
      throw new Error("NORMALIZED_WEIGHT_INVARIANT");
    }
  }

  public setSwapFeePercentage(swapFeePercentage: string) {
    if (bn(swapFeePercentage).lt(this.MIN_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MIN_SWAP_FEE_PERCENTAGE");
    }
    if (bn(swapFeePercentage).gt(this.MAX_SWAP_FEE_PERCENTAGE)) {
      throw new Error("MAX_SWAP_FEE_PERCENTAGE");
    }

    this._swapFeePercentage = swapFeePercentage;
  }

  public getInvariant(): string {
    const scaledInvariant = math._calculateInvariant(
      this.tokens.map((t) => scale(t.weight, 18)),
      this.tokens.map((t) => scale(t.balance, t.decimals))
    );
    const invariant = scale(scaledInvariant, -18);

    return invariant.toString();
  }

  protected swapGivenIn(
    tokenInName: string,
    tokenOutName: string,
    amountIn: string
  ): string {
    const tokenIn = this.tokens.find((t) => t.name === tokenInName);
    const tokenOut = this.tokens.find((t) => t.name === tokenOutName);

    const scaledAmountIn = scale(amountIn, tokenIn.decimals);

    // This returns amount - fee amount, so we round up (favoring a higher fee amount)
    const scaledAmountInWithFee = fp.sub(
      scaledAmountIn,
      fp.mulUp(scaledAmountIn, scale(this.swapFeePercentage, 18))
    );

    const scaledAmountOut = math._calcOutGivenIn(
      scale(tokenIn.balance, tokenIn.decimals),
      scale(tokenIn.weight, 18),
      scale(tokenOut.balance, tokenOut.decimals),
      scale(tokenOut.weight, 18),
      scaledAmountInWithFee
    );
    const amountOut = scale(scaledAmountOut, -18);

    // Update the balances of the swapped tokens
    tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
    tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();

    return amountOut.toString();
  }

  protected swapGivenOut(
    tokenInName: string,
    tokenOutName: string,
    amountOut: string
  ): string {
    const tokenIn = this.tokens.find((t) => t.name === tokenInName);
    const tokenOut = this.tokens.find((t) => t.name === tokenOutName);

    const scaledAmountOut = scale(amountOut, tokenOut.decimals);

    const scaledAmountIn = math._calcInGivenOut(
      scale(tokenIn.balance, tokenIn.decimals),
      scale(tokenIn.weight, 18),
      scale(tokenOut.balance, tokenOut.decimals),
      scale(tokenOut.weight, 18),
      scaledAmountOut
    );

    // This returns amount + fee amount, so we round up (favoring a higher fee amount)
    const scaledAmountInWithFee = fp.divUp(
      scaledAmountIn,
      fp.complement(scale(this.swapFeePercentage, 18))
    );

    const amountIn = scale(scaledAmountInWithFee, -18);

    // Update the balances of the swapped tokens
    tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
    tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();

    return amountIn.toString();
  }
}
