// Ported from Solidity:
// https://github.com/balancer-labs/balancer-core-v2/blob/master/pkg/pool-weighted/contracts/WeightedMath.sol

// The following edits have been made:
// * the swap fee is added to the swap functions (in Solidity, the fees are charged outside)
// * Added `_exactTokenInForBptOut` and `_bptInForExactTokenOut` for convenience

import BigNumber from "../../utils/big-number";
import * as fp from "../../utils/math/fixed-point";

export function invariant(
  normalizedWeights: BigNumber[],
  balances: BigNumber[]
): BigNumber {
  /*****************************************************************************************
  // invariant               _____                                                        //
  // wi = weight index i      | |      wi                                                 //
  // bi = balance index i     | |  bi ^   = i                                             //
  // i = invariant                                                                        //
  *****************************************************************************************/

  let invariant = fp.ONE;
  for (let i = 0; i < normalizedWeights.length; i++) {
    invariant = fp.mulDown(
      invariant,
      fp.powDown(balances[i], normalizedWeights[i])
    );
  }
  return invariant;
}

// Computes how many tokens can be taken out of a pool if `amountIn` is sent, given the
// current balances and weights.
export function exactTokenInForTokenOut(
  balanceIn: BigNumber,
  weightIn: BigNumber,
  balanceOut: BigNumber,
  weightOut: BigNumber,
  amountIn: BigNumber,
  swapFee: BigNumber
): BigNumber {
  /*****************************************************************************************
  // outGivenIn                                                                           //
  // ao = amountOut                                                                       //
  // bo = balanceOut                                                                      //
  // bi = balanceIn              /      /            bi             \    (wi / wo) \      //
  // ai = amountIn    ao = bo * |  1 - | --------------------------  | ^            |     //
  // wi = weightIn               \      \       ( bi + ai )         /              /      //
  // wo = weightOut                                                                       //
  *****************************************************************************************/

  // Amount out, so we round down overall

  // The multiplication rounds down, and the subtrahend (power) rounds up (so the base rounds up too)
  // Because bi / (bi + ai) <= 1, the exponent rounds down

  // Handle fee (in Solidity code, fees are handled at another layer)
  amountIn = fp.mulUp(amountIn, fp.complement(swapFee));

  const denominator = fp.add(balanceIn, amountIn);
  const base = fp.divUp(balanceIn, denominator);
  const exponent = fp.divDown(weightIn, weightOut);
  const power = fp.powUp(base, exponent);

  return fp.mulDown(balanceOut, fp.complement(power));
}

// Computes how many tokens must be sent to a pool in order to take `amountOut`, given the
// current balances and weights.
export function tokenInForExactTokenOut(
  balanceIn: BigNumber,
  weightIn: BigNumber,
  balanceOut: BigNumber,
  weightOut: BigNumber,
  amountOut: BigNumber,
  swapFee: BigNumber
): BigNumber {
  /*****************************************************************************************
  // inGivenOut                                                                           //
  // ao = amountOut                                                                       //
  // bo = balanceOut                                                                      //
  // bi = balanceIn              /  /            bo             \    (wo / wi)      \     //
  // ai = amountIn    ai = bi * |  | --------------------------  | ^            - 1  |    //
  // wi = weightIn               \  \       ( bo - ao )         /                   /     //
  // wo = weightOut                                                                       //
  *****************************************************************************************/

  // Amount in, so we round up overall

  // The multiplication rounds up, and the power rounds up (so the base rounds up too)
  // Because bo / (bo - ao) >= 1, the exponent rounds up

  const base = fp.divUp(balanceOut, fp.sub(balanceOut, amountOut));
  const exponent = fp.divUp(weightOut, weightIn);
  const power = fp.powUp(base, exponent);

  const ratio = fp.sub(power, fp.ONE);

  // Handle fee (in Solidity code, fees are handled at another layer)
  return fp.divUp(fp.mulUp(balanceIn, ratio), fp.complement(swapFee));
}

// export function exactTokensInForBptOut(
//   balances: FixedPointNumber[],
//   normalizedWeights: FixedPointNumber[],
//   amountsIn: FixedPointNumber[],
//   bptTotalSupply: FixedPointNumber,
//   swapFee: FixedPointNumber
// ): FixedPointNumber {
//   // BPT out, so we round down overall

//   // First loop - calculate the weighted balance ratio
//   // Quotients of new and current balances for each token without considering fees
//   const tokenBalanceRatiosWithoutFee = new Array(amountsIn.length);
//   // The weighted sum of token balance ratios without considering fees
//   let weightedBalanceRatio = fpn(0);
//   for (let i = 0; i < balances.length; i++) {
//     tokenBalanceRatiosWithoutFee[i] = balances[i]
//       .add(amountsIn[i])
//       .divDown(balances[i]);
//     weightedBalanceRatio = weightedBalanceRatio.add(
//       tokenBalanceRatiosWithoutFee[i].mulDown(normalizedWeights[i])
//     );
//   }

//   // Second loop - calculate new amounts in by taking into account the fee on the % excess
//   // The growth of the invariant caused by the join, as a quotient of the new value and the current one
//   let invariantRatio = ONE;
//   for (let i = 0; i < balances.length; i++) {
//     // Percentage of the amount supplied that will be swapped for other tokens in the pool
//     let tokenBalancePercentageExcess: FixedPointNumber;
//     // Some tokens might have amounts supplied in excess of a 'balanced' join: these are identified if
//     // the token's balance ratio without fees is larger than the weighted balance ratio, and swap fees charged
//     // on the amount to swap
//     if (weightedBalanceRatio >= tokenBalanceRatiosWithoutFee[i]) {
//       tokenBalancePercentageExcess = fpn(0);
//     } else {
//       tokenBalancePercentageExcess = tokenBalanceRatiosWithoutFee[i]
//         .sub(weightedBalanceRatio)
//         .divUp(tokenBalanceRatiosWithoutFee[i].sub(ONE));
//     }

//     const swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
//     const amountInAfterFee = amountsIn[i].mulDown(swapFeeExcess.complement());
//     const tokenBalanceRatio = ONE.add(amountInAfterFee.divDown(balances[i]));

//     invariantRatio = invariantRatio.mulDown(
//       tokenBalanceRatio.powDown(normalizedWeights[i])
//     );
//   }

//   return bptTotalSupply.mulDown(invariantRatio.sub(ONE));
// }

// // This function was added for convenience (adapted from the above `_exactTokensInForBptOut`).
// export function exactTokenInForBptOut(
//   balance: FixedPointNumber,
//   normalizedWeight: FixedPointNumber,
//   amountIn: FixedPointNumber,
//   bptTotalSupply: FixedPointNumber,
//   swapFee: FixedPointNumber
// ): FixedPointNumber {
//   // BPT out, so we round down overall

//   const tokenBalanceRatioWithoutFee = balance.add(amountIn).divDown(balance);
//   const weightedBalanceRatio =
//     tokenBalanceRatioWithoutFee.mulDown(normalizedWeight);

//   // Percentage of the amount supplied that will be swapped for other tokens in the pool
//   let tokenBalancePercentageExcess: FixedPointNumber;
//   // Some tokens might have amounts supplied in excess of a 'balanced' join: these are identified if
//   // the token's balance ratio without fees is larger than the weighted balance ratio, and swap fees charged
//   // on the amount to swap
//   if (weightedBalanceRatio >= tokenBalanceRatioWithoutFee) {
//     tokenBalancePercentageExcess = fpn(0);
//   } else {
//     tokenBalancePercentageExcess = tokenBalanceRatioWithoutFee
//       .sub(weightedBalanceRatio)
//       .divUp(tokenBalanceRatioWithoutFee.sub(ONE));
//   }

//   const swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
//   const amountInAfterFee = amountIn.mulDown(swapFeeExcess.complement());
//   const tokenBalanceRatio = ONE.add(amountInAfterFee.divDown(balance));

//   const invariantRatio = ONE.mulDown(
//     tokenBalanceRatio.powDown(normalizedWeight)
//   );

//   return bptTotalSupply.mulDown(invariantRatio.sub(ONE));
// }

// export function tokenInForExactBptOut(
//   balance: FixedPointNumber,
//   normalizedWeight: FixedPointNumber,
//   bptAmountOut: FixedPointNumber,
//   bptTotalSupply: FixedPointNumber,
//   swapFee: FixedPointNumber
// ): FixedPointNumber {
//   /*****************************************************************************************
//   // tokenInForExactBptOut                                                                //
//   // a = amountIn                                                                         //
//   // b = balance                      /  /     bpt + bptOut     \    (1 / w)      \       //
//   // bptOut = bptAmountOut   a = b * |  | ---------------------- | ^          - 1  |      //
//   // bpt = bptTotalSupply             \  \         bpt          /                 /       //
//   // w = normalizedWeight                                                                 //
//   *****************************************************************************************/

//   // Token in, so we round up overall

//   // Calculate the factor by which the invariant will increase after minting `bptAmountOut`
//   const invariantRatio = bptTotalSupply.add(bptAmountOut).divUp(bptTotalSupply);

//   // Calculate by how much the token balance has to increase to cause `invariantRatio`
//   const tokenBalanceRatio = invariantRatio.powUp(ONE.divUp(normalizedWeight));
//   const tokenBalancePercentageExcess = normalizedWeight.complement();
//   const amountInAfterFee = balance.mulUp(tokenBalanceRatio.sub(ONE));

//   const swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);

//   return amountInAfterFee.divUp(swapFeeExcess.complement());
// }

// export function exactBptInForTokenOut(
//   balance: FixedPointNumber,
//   normalizedWeight: FixedPointNumber,
//   bptAmountIn: FixedPointNumber,
//   bptTotalSupply: FixedPointNumber,
//   swapFee: FixedPointNumber
// ): FixedPointNumber {
//   /*****************************************************************************************
//   // exactBptInForTokenOut                                                                //
//   // a = amountOut                                                                        //
//   // b = balance                     /      /    bpt - bptIn    \    (1 / w)  \           //
//   // bptIn = bptAmountIn    a = b * |  1 - | ------------------- | ^           |          //
//   // bpt = bptTotalSupply            \      \        bpt        /             /           //
//   // w = weight                                                                           //
//   *****************************************************************************************/

//   // Token out, so we round down overall

//   // Calculate the factor by which the invariant will decrease after burning `bptAmountIn`
//   const invariantRatio = bptTotalSupply.sub(bptAmountIn).divUp(bptTotalSupply);

//   // Calculate by how much the token balance has to increase to cause `invariantRatio`
//   const tokenBalanceRatio = invariantRatio.powUp(ONE.divUp(normalizedWeight));
//   const tokenBalancePercentageExcess = normalizedWeight.complement();

//   // Because of rounding up, `tokenBalanceRatio` can be greater than one
//   const amountOutBeforeFee = balance.mulDown(tokenBalanceRatio.complement());

//   const swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);

//   return amountOutBeforeFee.mulDown(swapFeeExcess.complement());
// }

// export function exactBptInForTokensOut(
//   balances: FixedPointNumber[],
//   bptAmountIn: FixedPointNumber,
//   bptTotalSupply: FixedPointNumber
// ): FixedPointNumber[] {
//   /*****************************************************************************************
//   // exactBptInForTokensOut                                                               //
//   // (formula per token)                                                                  //
//   // ao = amountOut                  /   bptIn   \                                        //
//   // b = balance           ao = b * | ----------- |                                       //
//   // bptIn = bptAmountIn             \    bpt    /                                        //
//   // bpt = bptTotalSupply                                                                 //
//   *****************************************************************************************/

//   // Token out, so we round down overall
//   // This means rounding down on both multiplication and division

//   const bptRatio = bptAmountIn.divDown(bptTotalSupply);

//   const amountsOut = new Array(balances.length);
//   for (let i = 0; i < balances.length; i++) {
//     amountsOut[i] = balances[i].mulDown(bptRatio);
//   }

//   return amountsOut;
// }

// export function bptInForExactTokensOut(
//   balances: FixedPointNumber[],
//   normalizedWeights: FixedPointNumber[],
//   amountsOut: FixedPointNumber[],
//   bptTotalSupply: FixedPointNumber,
//   swapFee: FixedPointNumber
// ): FixedPointNumber {
//   // BPT in, so we round up overall

//   // First loop - calculate the weighted balance ratio
//   const tokenBalanceRatiosWithoutFee = new Array(amountsOut.length);
//   let weightedBalanceRatio = fpn(0);
//   for (let i = 0; i < balances.length; i++) {
//     tokenBalanceRatiosWithoutFee[i] = balances[i]
//       .sub(amountsOut[i])
//       .divUp(balances[i]);
//     weightedBalanceRatio = weightedBalanceRatio.add(
//       tokenBalanceRatiosWithoutFee[i].mulUp(normalizedWeights[i])
//     );
//   }

//   // Second loop - calculate new amounts in by taking into account the fee on the % excess
//   let invariantRatio = ONE;
//   for (let i = 0; i < balances.length; i++) {
//     let tokenBalancePercentageExcess: FixedPointNumber;

//     // For each `ratioWithoutFee`, compare with `weightedBalanceRatio` and decrease the fee from what goes above it
//     if (weightedBalanceRatio <= tokenBalanceRatiosWithoutFee[i]) {
//       tokenBalancePercentageExcess = fpn(0);
//     } else {
//       tokenBalancePercentageExcess = weightedBalanceRatio
//         .sub(tokenBalanceRatiosWithoutFee[i])
//         .divUp(tokenBalanceRatiosWithoutFee[i].complement());
//     }

//     const swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
//     const amountOutBeforeFee = amountsOut[i].divUp(swapFeeExcess.complement());
//     const tokenBalanceRatio = amountOutBeforeFee
//       .divUp(balances[i])
//       .complement();

//     invariantRatio = invariantRatio.mulDown(
//       tokenBalanceRatio.powDown(normalizedWeights[i])
//     );
//   }

//   return bptTotalSupply.mulUp(invariantRatio.complement());
// }

// // This function was added for convenience (adapted from the above `_bptInForExactTokensOut`).
// export function bptInForExactTokenOut(
//   balance: FixedPointNumber,
//   normalizedWeight: FixedPointNumber,
//   amountOut: FixedPointNumber,
//   bptTotalSupply: FixedPointNumber,
//   swapFee: FixedPointNumber
// ): FixedPointNumber {
//   // BPT in, so we round up overall

//   const tokenBalanceRatioWithoutFee = balance.sub(amountOut).divUp(balance);
//   const weightedBalanceRatio =
//     tokenBalanceRatioWithoutFee.mulUp(normalizedWeight);

//   let invariantRatio = ONE;
//   let tokenBalancePercentageExcess: FixedPointNumber;

//   // Compare with `weightedBalanceRatio` and decrease the fee from what goes above it
//   if (weightedBalanceRatio <= tokenBalanceRatioWithoutFee) {
//     tokenBalancePercentageExcess = fpn(0);
//   } else {
//     tokenBalancePercentageExcess = weightedBalanceRatio
//       .sub(tokenBalanceRatioWithoutFee)
//       .divUp(tokenBalanceRatioWithoutFee.complement());
//   }

//   const swapFeeExcess = swapFee.mulUp(tokenBalancePercentageExcess);
//   const amountOutBeforeFee = amountOut.divUp(swapFeeExcess.complement());
//   const tokenBalanceRatio = amountOutBeforeFee.divUp(balance).complement();

//   invariantRatio = invariantRatio.mulDown(
//     tokenBalanceRatio.powDown(normalizedWeight)
//   );

//   return bptTotalSupply.mulUp(invariantRatio.complement());
// }
