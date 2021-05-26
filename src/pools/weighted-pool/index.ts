import BigNumber, { bn, scale } from "../../utils/big-number";
import * as math from "./math";

import { IPool, PairTypes, PoolTypes } from "../base-types";
import { IWeightedPoolPair, IWeightedPoolToken } from "./types";

export default class WeightedPool implements IPool {
  public poolId: string;
  public poolType = PoolTypes.Weighted;
  public tokens: IWeightedPoolToken[];
  public swapFee: BigNumber;
  public totalShares: BigNumber;
  public totalWeight: BigNumber;

  constructor(
    poolId: string,
    tokens: IWeightedPoolToken[],
    swapFee: BigNumber,
    totalShares: BigNumber
  ) {
    this.poolId = poolId;
    this.tokens = tokens;
    this.swapFee = swapFee;
    this.totalShares = totalShares;
    this.totalWeight = tokens
      .map(({ weight }) => weight)
      .reduce((totalWeight, weight) => totalWeight.plus(weight), bn(0));
  }

  public getPoolPair(
    tokenInAddress: string,
    tokenOutAddress: string
  ): IWeightedPoolPair {
    const tokenIn = this.tokens.find(
      ({ address }) => address === tokenInAddress
    );
    if (!tokenIn) {
      throw new Error("Pool does not contain given tokenIn");
    }

    const tokenOut = this.tokens.find(
      ({ address }) => address === tokenOutAddress
    );
    if (!tokenOut) {
      throw new Error("Pool does not contain given tokenOut");
    }

    let pairType: PairTypes;
    let balanceIn: BigNumber;
    let balanceOut: BigNumber;
    let decimalsOut: number;
    let decimalsIn: number;
    let weightIn: BigNumber;
    let weightOut: BigNumber;

    // Determine the pair's type by checking if tokenIn or tokenOut is the pool itself (BPT)
    if (tokenInAddress === this.poolId) {
      pairType = PairTypes.BptToToken;
      if (!this.totalShares) {
        throw new Error("Pool missing totalShares field");
      }
      balanceIn = this.totalShares;
      decimalsIn = 18; // Not used but needs to be defined
      weightIn = bn(1); // Not used but needs to be defined
    } else if (tokenOutAddress === this.poolId) {
      pairType = PairTypes.TokenToBpt;
      if (!this.totalShares) {
        throw new Error("Pool missing totalShares field");
      }
      balanceOut = this.totalShares;
      decimalsOut = 18; // Not used but needs to be defined
      weightOut = bn(1); // Not used but needs to be defined
    } else {
      pairType = PairTypes.TokenToToken;
    }

    if (pairType != PairTypes.BptToToken) {
      balanceIn = tokenIn.balance;
      decimalsIn = tokenIn.decimals;
      weightIn = tokenIn.weight.div(this.totalWeight);
    }
    if (pairType != PairTypes.TokenToBpt) {
      balanceOut = tokenOut.balance;
      decimalsOut = tokenOut.decimals;
      weightOut = tokenOut.weight.div(this.totalWeight);
    }

    return {
      poolId: this.poolId,
      poolType: this.poolType,
      pairType: pairType,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      decimalsIn: decimalsIn,
      decimalsOut: decimalsOut,
      swapFee: this.swapFee,
      weightIn: weightIn,
      weightOut: weightOut,
    };
  }

  public invariant(): BigNumber {
    const normalizedWeights = this.tokens.map(({ weight }) =>
      scale(weight.div(this.totalWeight), 18)
    );
    const balances = this.tokens.map(({ balance, decimals }) =>
      scale(balance, decimals)
    );

    const result = math.invariant(normalizedWeights, balances);
    return scale(result, -18);
  }

  public exactTokenInForTokenOut(
    poolPair: IWeightedPoolPair,
    amount: BigNumber
  ): BigNumber {
    const result = math.exactTokenInForTokenOut(
      scale(poolPair.balanceIn, poolPair.decimalsIn),
      scale(poolPair.weightIn, 18),
      scale(poolPair.balanceOut, poolPair.decimalsOut),
      scale(poolPair.weightOut, 18),
      scale(amount, poolPair.decimalsIn),
      scale(poolPair.swapFee, 18)
    );
    return scale(result, -18);
  }

  public tokenInForExactTokenOut(
    poolPair: IWeightedPoolPair,
    amount: BigNumber
  ): BigNumber {
    const result = math.exactTokenInForTokenOut(
      scale(poolPair.balanceIn, poolPair.decimalsIn),
      scale(poolPair.weightIn, 18),
      scale(poolPair.balanceOut, poolPair.decimalsOut),
      scale(poolPair.weightOut, 18),
      scale(amount, poolPair.decimalsIn),
      scale(poolPair.swapFee, 18)
    );
    return scale(result, -18);
  }

  // public exactTokenInForBptOut(
  //   poolPair: IWeightedPoolPair,
  //   amount: BigNumber
  // ): BigNumber {}

  // public exactBptInForTokenOut(
  //   poolPair: IWeightedPoolPair,
  //   amount: BigNumber
  // ): BigNumber {}

  // public tokenInForExactBptOut(
  //   poolPair: IWeightedPoolPair,
  //   amount: BigNumber
  // ): BigNumber {}

  // public bptInForExactTokenOut(
  //   poolPair: IWeightedPoolPair,
  //   amount: BigNumber
  // ): BigNumber {}
}
