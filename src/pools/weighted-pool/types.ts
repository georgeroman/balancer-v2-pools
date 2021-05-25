import BigNumber from "../../utils/big-number";
import { IPoolPair } from "../base-types";

export interface IWeightedPoolPair extends IPoolPair {
  weightIn: BigNumber;
  weightOut: BigNumber;
}

export interface IWeightedPoolToken {
  address: string;
  balance: BigNumber;
  decimals: number;
  weight: BigNumber;
}
