import BigNumber from "../utils/big-number";

export enum PoolTypes {
  Weighted,
}

// For simplicity, adding/removing liquidity is handled as a swap between a token and BPT
export enum PairTypes {
  BptToToken,
  TokenToBpt,
  TokenToToken,
}

export enum SwapTypes {
  ExactIn,
  ExactOut,
}

export interface IPoolPair {
  poolId: string;
  poolType: PoolTypes;
  pairType: PairTypes;
  balanceIn: BigNumber;
  balanceOut: BigNumber;
  tokenIn: string;
  tokenOut: string;
  decimalsIn: number;
  decimalsOut: number;
  swapFee: BigNumber;
}

export interface IPool {
  poolId: string;
  poolType: PoolTypes;
  tokens: string[];
  swapFee: BigNumber;

  getPoolPair: (tokenInAddress: string, tokenOutAddress: string) => IPoolPair;

  exactTokenInForTokenOut: (
    poolPair: IPoolPair,
    amount: BigNumber
  ) => BigNumber;

  tokenInForExactTokenOut: (
    poolPair: IPoolPair,
    amount: BigNumber
  ) => BigNumber;

  // exactTokenInForBptOut: (
  //   poolPairData: IPoolPair,
  //   amount: BigNumber
  // ) => BigNumber;

  // exactBptInForTokenOut: (
  //   poolPairData: IPoolPair,
  //   amount: BigNumber
  // ) => BigNumber;

  // tokenInForExactBptOut: (
  //   poolPairData: IPoolPair,
  //   amount: BigNumber
  // ) => BigNumber;

  // bptInForExactTokenOut: (
  //   poolPairData: IPoolPair,
  //   amount: BigNumber
  // ) => BigNumber;
}
