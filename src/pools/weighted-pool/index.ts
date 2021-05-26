import BigNumber, { bn, scale } from "../../utils/big-number";

import * as fp from "../../utils/math/fixed-point";
import BasePool from "../base-pool";
import { PoolType } from "../base-types";
import * as math from "./math";
import { IWeightedPoolToken } from "./types";

export default class WeightedPool extends BasePool {
  // A minimum normalized weight imposes a maximum weight ratio
  // We need this due to limitations in the implementation of the power function, as these ratios are often exponents
  private MIN_WEIGHT = new BigNumber("10000000000000000"); // 0.01e18

  private _wTokens: IWeightedPoolToken[];

  get tokens() {
    return this._wTokens;
  }

  constructor(
    poolId: string,
    tokens: IWeightedPoolToken[],
    swapFeePercentage: BigNumber
  ) {
    super(
      poolId,
      PoolType.Weighted,
      tokens.map(({ address }) => address),
      swapFeePercentage
    );

    let normalizedSum = fp.ZERO;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].weight.lt(this.MIN_WEIGHT)) {
        throw new Error("MIN_WEIGHT");
      }
      normalizedSum = normalizedSum.plus(tokens[i].weight);
    }

    if (!normalizedSum.eq(fp.ONE)) {
      throw new Error("NORMALIZED_WEIGHT_INVARIANT");
    }
  }

  public getInvariant(): BigNumber {
    const normalizedWeights = this.tokens.map(({ weight }) =>
      scale(weight, 18)
    );
    const balances = this.tokens.map(({ balance, decimals }) =>
      scale(balance, decimals)
    );

    const result = math._calculateInvariant(normalizedWeights, balances);
    return scale(result, -18);
  }

  protected _onSwapGivenIn(
    tokenIn: string,
    tokenOut: string,
    amount: BigNumber
  ): BigNumber {
    const {
      balance: balanceIn,
      decimals: decimalsIn,
      weight: weightIn,
    } = this.tokens.find(({ address }) => address === tokenIn);
    const {
      balance: balanceOut,
      decimals: decimalsOut,
      weight: weightOut,
    } = this.tokens.find(({ address }) => address === tokenOut);

    const result = math._calcOutGivenIn(
      scale(balanceIn, decimalsIn),
      scale(weightIn, 18),
      scale(balanceOut, decimalsOut),
      scale(weightOut, 18),
      scale(amount, decimalsIn)
    );
    return scale(result, -18);
  }

  protected _onSwapGivenOut(
    tokenIn: string,
    tokenOut: string,
    amount: BigNumber
  ): BigNumber {
    const {
      balance: balanceIn,
      decimals: decimalsIn,
      weight: weightIn,
    } = this.tokens.find(({ address }) => address === tokenIn);
    const {
      balance: balanceOut,
      decimals: decimalsOut,
      weight: weightOut,
    } = this.tokens.find(({ address }) => address === tokenOut);

    const result = math._calcOutGivenIn(
      scale(balanceIn, decimalsIn),
      scale(weightIn, 18),
      scale(balanceOut, decimalsOut),
      scale(weightOut, 18),
      scale(amount, decimalsIn)
    );
    return scale(result, -18);
  }
}
