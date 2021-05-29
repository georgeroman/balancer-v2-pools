import { bn, scale } from "../../utils/big-number";
import {
  addSwapFeePercentage,
  subtractSwapFeePercentage,
} from "../../utils/pool";
import * as math from "./math";

export interface IWeightedPoolToken {
  name: string;
  balance: string;
  decimals: number;
  weight: string;
}

export interface IWeightedPoolParams {
  name: string;
  tokens: IWeightedPoolToken[];
  bptTotalSupply: string;
  swapFeePercentage: string;
  query?: boolean;
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
  private _bptTotalSupply: string;
  private _swapFeePercentage: string;
  private _query = false;

  get name() {
    return this._name;
  }

  get tokens() {
    return this._tokens;
  }

  get bptTotalSupply() {
    return this._bptTotalSupply;
  }

  get swapFeePercentage() {
    return this._swapFeePercentage;
  }

  get query() {
    return this._query;
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
    this._bptTotalSupply = params.bptTotalSupply;
    this.setSwapFeePercentage(params.swapFeePercentage);

    if (params.query) {
      this._query = params.query;
    }

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

  public setQuery(query: boolean) {
    this._query = query;
  }

  public getInvariant(): string {
    const scaledInvariant = math._calculateInvariant(
      this._tokens.map((t) => scale(t.weight, 18)),
      this._tokens.map((t) => scale(t.balance, t.decimals))
    );
    const invariant = scale(scaledInvariant, -18);

    return invariant.toString();
  }

  public swapGivenIn(
    tokenInName: string,
    tokenOutName: string,
    amountIn: string
  ): string {
    const tokenIn = this._tokens.find((t) => t.name === tokenInName);
    const tokenOut = this._tokens.find((t) => t.name === tokenOutName);

    const scaledAmountIn = scale(amountIn, tokenIn.decimals);
    const scaledAmountInWithFee = subtractSwapFeePercentage(
      scaledAmountIn,
      scale(this._swapFeePercentage, 18)
    );

    const scaledAmountOut = math._calcOutGivenIn(
      scale(tokenIn.balance, tokenIn.decimals),
      scale(tokenIn.weight, 18),
      scale(tokenOut.balance, tokenOut.decimals),
      scale(tokenOut.weight, 18),
      scaledAmountInWithFee
    );
    const amountOut = scale(scaledAmountOut, -18);

    if (!this._query) {
      // Update the balances of the swapped tokens
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();
    }

    return amountOut.toString();
  }

  public swapGivenOut(
    tokenInName: string,
    tokenOutName: string,
    amountOut: string
  ): string {
    const tokenIn = this._tokens.find((t) => t.name === tokenInName);
    const tokenOut = this._tokens.find((t) => t.name === tokenOutName);

    const scaledAmountOut = scale(amountOut, tokenOut.decimals);

    const scaledAmountIn = math._calcInGivenOut(
      scale(tokenIn.balance, tokenIn.decimals),
      scale(tokenIn.weight, 18),
      scale(tokenOut.balance, tokenOut.decimals),
      scale(tokenOut.weight, 18),
      scaledAmountOut
    );

    const scaledAmountInWithFee = addSwapFeePercentage(
      scaledAmountIn,
      scale(this._swapFeePercentage, 18)
    );
    const amountIn = scale(scaledAmountInWithFee, -18);

    if (!this._query) {
      // Update the balances of the swapped tokens
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();
    }

    return amountIn.toString();
  }

  public joinExactTokensInForBptOut(amountsIn: {
    [name: string]: string;
  }): string {
    if (Object.keys(amountsIn).length !== this._tokens.length) {
      throw new Error("Invalid input");
    }

    const scaledBptOut = math._calcBptOutGivenExactTokensIn(
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      this._tokens.map((t) => scale(t.weight, 18)),
      this._tokens.map((t) => scale(amountsIn[t.name], t.decimals)),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const bptOut = scale(scaledBptOut, -18);

    if (!this._query) {
      // Update the token balances
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .plus(amountsIn[token.name])
          .toString();
      }

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).plus(bptOut).toString();
    }

    return bptOut.toString();
  }

  public joinTokenInForExactBptOut(
    tokenInName: string,
    bptOut: string
  ): string {
    const tokenIn = this._tokens.find((t) => t.name === tokenInName);
    if (!tokenIn) {
      throw new Error("Invalid input");
    }

    const scaledAmountIn = math._calcTokenInGivenExactBptOut(
      scale(tokenIn.balance, tokenIn.decimals),
      scale(tokenIn.weight, 18),
      scale(bptOut, 18),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const amountIn = scale(scaledAmountIn, -18);

    if (!this._query) {
      // Update the token balances
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).plus(bptOut).toString();
    }

    return amountIn.toString();
  }

  public exitExactBptInForTokenOut(
    tokenOutName: string,
    bptIn: string
  ): string {
    const tokenOut = this._tokens.find((t) => t.name === tokenOutName);
    if (!tokenOut) {
      throw new Error("Invalid input");
    }

    const scaledAmountOut = math._calcTokenOutGivenExactBptIn(
      scale(tokenOut.balance, tokenOut.decimals),
      scale(tokenOut.weight, 18),
      scale(bptIn, 18),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 19)
    );
    const amountOut = scale(scaledAmountOut, -18);

    if (!this._query) {
      // Update the token balances
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).minus(bptIn).toString();
    }

    return amountOut.toString();
  }

  public exitExactBptInForTokensOut(bptIn: string): string[] {
    const scaledAmountsOut = math._calcTokensOutGivenExactBptIn(
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      scale(bptIn, 18),
      scale(this._bptTotalSupply, 18)
    );
    const amountsOut = scaledAmountsOut.map((a) => scale(a, -18));

    if (!this._query) {
      // Update the token balances
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .minus(amountsOut[token.name])
          .toString();
      }

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).minus(bptIn).toString();
    }

    return amountsOut.map((a) => a.toString());
  }

  public exitBptInForExactTokensOut(amountsOut: {
    [name: string]: string;
  }): string {
    if (Object.keys(amountsOut).length !== this._tokens.length) {
      throw new Error("Invalid input");
    }

    const scaledBptIn = math._calcBptInGivenExactTokensOut(
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      this._tokens.map((t) => scale(t.weight, 18)),
      this._tokens.map((t) => scale(amountsOut[t.name], t.decimals)),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const bptIn = scale(scaledBptIn, -18);

    if (!this._query) {
      // Update the token balances
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .minus(amountsOut[token.name])
          .toString();
      }

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).minus(bptIn).toString();
    }

    return bptIn.toString();
  }
}
