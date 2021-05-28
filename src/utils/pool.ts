import BigNumber from "./big-number";
import * as fp from "./math/fixed-point";

export const addSwapFeePercentage = (
  amount: BigNumber,
  swapFeePercentage: BigNumber
) => {
  // This returns amount + fee amount, so we round up (favoring a higher fee amount)
  return fp.divUp(amount, fp.complement(swapFeePercentage));
};

export const subtractSwapFeePercentage = (
  amount: BigNumber,
  swapFeePercentage: BigNumber
) => {
  // This returns amount - fee amount, so we round up (favoring a higher fee amount)
  return fp.sub(amount, fp.mulUp(amount, swapFeePercentage));
};
