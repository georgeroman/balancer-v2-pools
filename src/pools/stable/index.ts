import BasePool, { IBasePoolParams, IBasePoolToken } from "@pools/base";
import * as math from "@pools/stable/math";
import { getPool } from "@subgraph/index";
import { bn, scale } from "@utils/big-number";
import { shallowCopyAll } from "@utils/common";

export interface IStablePoolToken extends IBasePoolToken {}

export interface IStablePoolParams extends IBasePoolParams {
  tokens: IStablePoolToken[];
  amplificationParameter: string;
}

export default class StablePool extends BasePool {
  private _tokens: IStablePoolToken[];
  private _amplificationParameter: string;

  // ---------------------- Getters ----------------------

  get tokens() {
    // Shallow-copy to disallow direct changes
    return shallowCopyAll(this._tokens);
  }

  get amplificationParameter() {
    return this._amplificationParameter;
  }

  // ---------------------- Constructor ----------------------

  constructor(params: IStablePoolParams) {
    super(params);

    if (params.tokens.length < math.MAX_STABLE_TOKENS) {
      throw new Error("MAX_STABLE_TOKENS");
    }

    this._tokens = shallowCopyAll(params.tokens);

    if (bn(params.amplificationParameter).lt(math.MIN_AMP)) {
      throw new Error("MIN_AMP");
    }
    if (bn(params.amplificationParameter).gt(math.MAX_AMP)) {
      throw new Error("MAX_AMP");
    }

    this._amplificationParameter = bn(params.amplificationParameter)
      .times(math.AMP_PRECISION)
      .toString();
  }

  // ---------------------- Subgraph initializer ----------------------

  public static async initFromRealPool(
    poolId: string,
    query = false,
    blockNumber?: number
  ): Promise<StablePool> {
    const pool = await getPool(poolId, blockNumber);
    if (!pool) {
      throw new Error("Could not fetch pool data");
    }

    if (pool.poolType !== "Stable") {
      throw new Error("Pool must be stable");
    }

    const id = pool.id;
    const address = pool.address;
    const bptTotalSupply = pool.totalShares;
    const swapFeePercentage = pool.swapFee;
    const amplificationParameter = pool.amp;

    const tokens: IStablePoolToken[] = [];
    for (const token of pool.tokens) {
      tokens.push(token as IStablePoolToken);
    }

    return new StablePool({
      id,
      address,
      tokens,
      bptTotalSupply,
      swapFeePercentage,
      amplificationParameter,
      query,
    });
  }

  // ---------------------- Swap actions ----------------------

  public swapGivenIn(
    tokenInSymbol: string,
    tokenOutSymbol: string,
    amountIn: string
  ): string {
    const tokenIndexIn = this._tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );
    const tokenIndexOut = this._tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenIn = this._tokens[tokenIndexIn];
    const tokenOut = this._tokens[tokenIndexOut];

    const scaledAmountIn = scale(amountIn, tokenIn.decimals);
    const scaledAmountInWithFee = this._subtractSwapFeePercentage(
      scaledAmountIn,
      scale(this._swapFeePercentage, 18)
    );

    const scaledAmountOut = math._calcOutGivenIn(
      bn(this._amplificationParameter),
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      tokenIndexIn,
      tokenIndexOut,
      scaledAmountInWithFee
    );
    const amountOut = scale(scaledAmountOut, -18);

    if (!this._query) {
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
    const tokenIndexIn = this._tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );
    const tokenIndexOut = this._tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenIn = this._tokens[tokenIndexIn];
    const tokenOut = this._tokens[tokenIndexOut];

    const scaledAmountOut = scale(amountOut, tokenOut.decimals);

    const scaledAmountIn = math._calcInGivenOut(
      bn(this._amplificationParameter),
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      tokenIndexIn,
      tokenIndexOut,
      scaledAmountOut
    );

    const scaledAmountInWithFee = this._addSwapFeePercentage(
      scaledAmountIn,
      scale(this._swapFeePercentage, 18)
    );
    const amountIn = scale(scaledAmountInWithFee, -18);

    if (!this._query) {
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
      bn(this._amplificationParameter),
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      this._tokens.map((t) => scale(amountsIn[t.symbol], t.decimals)),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const bptOut = scale(scaledBptOut, -18);

    if (!this._query) {
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .plus(amountsIn[token.symbol])
          .toString();
      }

      this._bptTotalSupply = bn(this._bptTotalSupply).plus(bptOut).toString();
    }

    return bptOut.toString();
  }

  public joinTokenInForExactBptOut(
    tokenInSymbol: string,
    bptOut: string
  ): string {
    const tokenIndex = this._tokens.findIndex(
      (t) => t.symbol === tokenInSymbol
    );

    const tokenIn = this._tokens[tokenIndex];
    if (!tokenIn) {
      throw new Error("Invalid input");
    }

    const scaledAmountIn = math._calcTokenInGivenExactBptOut(
      bn(this._amplificationParameter),
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      tokenIndex,
      scale(bptOut, 18),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const amountIn = scale(scaledAmountIn, -18);

    if (!this._query) {
      tokenIn.balance = bn(tokenIn.balance).plus(amountIn).toString();

      this._bptTotalSupply = bn(this._bptTotalSupply).plus(bptOut).toString();
    }

    return amountIn.toString();
  }

  public exitExactBptInForTokenOut(
    tokenOutSymbol: string,
    bptIn: string
  ): string {
    const tokenIndex = this._tokens.findIndex(
      (t) => t.symbol === tokenOutSymbol
    );

    const tokenOut = this._tokens[tokenIndex];
    if (!tokenOut) {
      throw new Error("Invalid input");
    }

    const scaledAmountOut = math._calcTokenOutGivenExactBptIn(
      bn(this._amplificationParameter),
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      tokenIndex,
      scale(bptIn, 18),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const amountOut = scale(scaledAmountOut, -18);

    if (!this._query) {
      tokenOut.balance = bn(tokenOut.balance).minus(amountOut).toString();

      this._bptTotalSupply = bn(this._bptTotalSupply).minus(bptIn).toString();
    }

    return amountOut.toString();
  }

  public exitExactBptInForTokensOut(bptIn: string): string[] {
    // Exactly match the EVM version
    if (bn(bptIn).gt(this._bptTotalSupply)) {
      throw new Error("BPT in exceeds total supply");
    }

    const scaledAmountsOut = math._calcTokensOutGivenExactBptIn(
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      scale(bptIn, 18),
      scale(this._bptTotalSupply, 18)
    );
    const amountsOut = scaledAmountsOut.map((a) => scale(a, -18));

    if (!this._query) {
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance).minus(amountsOut[i]).toString();
      }

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
      bn(this._amplificationParameter),
      this._tokens.map((t) => scale(t.balance, t.decimals)),
      this._tokens.map((t) => scale(amountsOut[t.symbol], t.decimals)),
      scale(this._bptTotalSupply, 18),
      scale(this._swapFeePercentage, 18)
    );
    const bptIn = scale(scaledBptIn, -18);

    if (!this._query) {
      for (let i = 0; i < this._tokens.length; i++) {
        const token = this._tokens[i];
        token.balance = bn(token.balance)
          .minus(amountsOut[token.symbol])
          .toString();
      }

      this._bptTotalSupply = bn(this._bptTotalSupply).minus(bptIn).toString();
    }

    return bptIn.toString();
  }
}
