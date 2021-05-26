import BigNumber from "../utils/big-number";

export enum PoolType {
  Weighted,
}

// For simplicity, adding/removing liquidity is handled as a swap between a token and BPT
export enum PairType {
  BptToToken,
  TokenToBpt,
  TokenToToken,
}

export enum SwapType {
  GivenIn,
  GivenOut,
}

export interface IPoolToken {
  address: string;
  balance: BigNumber;
  decimals: number;
}
