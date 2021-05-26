import BigNumber from "../../utils/big-number";
import { IPoolToken } from "../base-types";

export interface IWeightedPoolToken extends IPoolToken {
  weight: BigNumber;
}
