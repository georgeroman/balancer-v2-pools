import BigNumber from "../../utils/big-number";
import { IPoolPair, IPoolToken } from "../base-types";

export interface IWeightedPoolPair extends IPoolPair {
  weightIn: BigNumber;
  weightOut: BigNumber;
}

export interface IWeightedPoolToken extends IPoolToken {
  weight: BigNumber;
}
