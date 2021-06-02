import BasePool, { IBasePoolParams, IBasePoolToken } from "@pools/base";
import * as math from "@pools/weighted/math";
import { getPool } from "@subgraph/index";
import { bn, scale } from "@utils/big-number";
import { shallowCopyAll } from "@utils/common";

export interface IWeightedPoolToken extends IBasePoolToken {
  weight: string;
}

export interface IWeightedPoolParams extends IBasePoolParams {
  tokens: IWeightedPoolToken[];
}

export default class WeightedPool extends BasePool {
  // A minimum normalized weight imposes a maximum weight ratio
  // We need this due to limitations in the implementation of the power function, as these ratios are often exponents
  private MIN_WEIGHT = bn("0.01"); // 0.01e18

  private _tokens: IWeightedPoolToken[];

  // ---------------------- Getters ----------------------

  get tokens() {
    // Shallow-copy to disallow direct changes
    return shallowCopyAll(this._tokens);
  }

  // ---------------------- Constructor ----------------------

  constructor(params: IWeightedPoolParams) {
    super(params);

    this._tokens = shallowCopyAll(params.tokens);

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

  // ---------------------- Subgraph initializer ----------------------

  public static async initFromRealPool(
    poolId: string,
    query = false,
    blockNumber?: number
  ): Promise<WeightedPool> {
    const pool = await getPool(poolId, blockNumber);
    if (!pool) {
      throw new Error("Could not fetch pool data");
    }

    if (pool.poolType !== "Weighted") {
      throw new Error("Pool must be weighted");
    }

    const id = pool.id;
    const address = pool.address;
    const bptTotalSupply = pool.totalShares;
    const swapFeePercentage = pool.swapFee;

    const tokens: IWeightedPoolToken[] = [];
    for (const token of pool.tokens) {
      tokens.push(token as IWeightedPoolToken);
    }

    return new WeightedPool({
      id,
      address,
      tokens,
      bptTotalSupply,
      swapFeePercentage,
      query,
    });
  }

  // ---------------------- Misc ----------------------

  public getInvariant(): string {
    const scaledInvariant = math._calculateInvariant(
      this._tokens.map((t) => scale(t.weight, 18)),
      this._tokens.map((t) => scale(t.balance, t.decimals))
    );
    const invariant = scale(scaledInvariant, -18);

    return invariant.toString();
  }

  // ---------------------- Swap actions ----------------------

  public swapGivenIn(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountIn: string
  ): string {
    const tokenIn = this._tokens.find((t) => t.symbol === tokenInSymbol);
    const tokenOut = this._tokens.find((t) => t.symbol === tokenOutSymbol);

    const scaledAmountIn = scale(amountIn, tokenIn.decimals);
    const scaledAmountInWithFee = this._subtractSwapFeePercentage(
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
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountOut: string
  ): string {
    const tokenIn = this._tokens.find((t) => t.symbol === tokenInSymbol);
    const tokenOut = this._tokens.find((t) => t.symbol === tokenOutSymbol);

    const scaledAmountOut = scale(amountOut, tokenOut.decimals);

    const scaledAmountIn = math._calcInGivenOut(
      scale(tokenIn.balance, tokenIn.decimals),
      scale(tokenIn.weight, 18),
      scale(tokenOut.balance, tokenOut.decimals),
      scale(tokenOut.weight, 18),
      scaledAmountOut
    );

    const scaledAmountInWithFee = this._addSwapFeePercentage(
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

  // ---------------------- LP actions ----------------------

  public joinExactTokensInForBptOut(amountsIn: {
    [symbol: string]: string;
  }): string {
    if (Object.keys(amountsIn).length !== this._tokens.length) {
      throw new Error("Invalid input");
    }

    const scaledBptOut = math._calcBptOutGivenExactTokensIn(
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      this._tokens.map((t) => scale(t.weight, 18)),
      this._tokens.map((t) => scale(amountsIn[t.symbol], t.decimals)),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const bptOut = scale(scaledBptOut, -18);

    if (!this._query) {
      // Update the token balances
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .plus(amountsIn[token.symbol])
          .toString();
      }

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).plus(bptOut).toString();
    }

    return bptOut.toString();
  }

  public joinTokenInForExactBptOut(
    tokenInSymbol: string,
    bptOut: string
  ): string {
    const tokenIn = this._tokens.find((t) => t.symbol === tokenInSymbol);
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
    tokenOutSymbol: string,
    bptIn: string
  ): string {
    const tokenOut = this._tokens.find((t) => t.symbol === tokenOutSymbol);
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
          .minus(amountsOut[token.symbol])
          .toString();
      }

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).minus(bptIn).toString();
    }

    return amountsOut.map((a) => a.toString());
  }

  public exitBptInForExactTokensOut(amountsOut: {
    [symbol: string]: string;
  }): string {
    if (Object.keys(amountsOut).length !== this._tokens.length) {
      throw new Error("Invalid input");
    }

    const scaledBptIn = math._calcBptInGivenExactTokensOut(
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      this._tokens.map((t) => scale(t.weight, 18)),
      this._tokens.map((t) => scale(amountsOut[t.symbol], t.decimals)),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const bptIn = scale(scaledBptIn, -18);

    if (!this._query) {
      // Update the token balances
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .minus(amountsOut[token.symbol])
          .toString();
      }

      // Update the BPT supply
      this._bptTotalSupply = bn(this._bptTotalSupply).minus(bptIn).toString();
    }

    return bptIn.toString();
  }
}
