// Ported from Solidity:
// https://github.com/balancer-labs/balancer-core-v2/blob/70843e6a61ad11208c1cfabf5cfe15be216ca8d3/pkg/pool-stable/contracts/StableMath.sol

import BigNumber, { bn } from "../../utils/big-number";
import * as fp from "../../utils/math/math";
import * as math from "../../utils/math/math";

const MIN_AMP = bn(1);
const MAX_AMP = bn(5000);
const AMP_PRECISION = bn(1000);

const MAX_STABLE_TOKENS = 5;

// Computes the invariant given the current balances, using the Newton-Raphson approximation.
// The amplification parameter equals: A n^(n-1)
export const _calculateInvariant = (
  amplificationParameter: BigNumber,
  balances: BigNumber[],
  roundUp: boolean
): BigNumber => {
  /**********************************************************************************************
  // invariant                                                                                 //
  // D = invariant                                                  D^(n+1)                    //
  // A = amplification coefficient      A  n^n S + D = A D n^n + -----------                   //
  // S = sum of balances                                             n^n P                     //
  // P = product of balances                                                                   //
  // n = number of tokens                                                                      //
  **********************************************************************************************/

  // We support rounding up or down.

  let sum = math.ZERO;
  let numTokens = bn(balances.length);
  for (let i = 0; i < balances.length; i++) {
    sum = fp.add(sum, balances[i]);
  }
  if (sum.isZero()) {
    return math.ZERO;
  }
  let prevInvariant = math.ZERO;
  let invariant = sum;
  let ampTimesTotal = math.mul(amplificationParameter, numTokens);

  for (let i = 0; i < 255; i++) {
    let P_D = math.mul(numTokens, balances[0]);
    for (let j = 1; j < balances.length; j++) {
      P_D = math.div(
        math.mul(math.mul(P_D, balances[j]), numTokens),
        invariant,
        roundUp
      );
    }
    prevInvariant = invariant;
    invariant = math.div(
      fp.add(
        math.mul(math.mul(numTokens, invariant), invariant),
        math.div(
          math.mul(math.mul(ampTimesTotal, sum), P_D),
          AMP_PRECISION,
          roundUp
        )
      ),
      fp.add(
        math.mul(fp.add(numTokens, math.ONE), invariant),
        math.div(
          math.mul(fp.sub(ampTimesTotal, AMP_PRECISION), P_D),
          AMP_PRECISION,
          !roundUp
        )
      ),
      roundUp
    );

    if (invariant.gt(prevInvariant)) {
      if (fp.sub(invariant, prevInvariant).lte(math.ONE)) {
        return invariant;
      }
    } else if (fp.sub(prevInvariant, invariant).lte(math.ONE)) {
      return invariant;
    }
  }

  throw new Error("STABLE_GET_BALANCE_DIDNT_CONVERGE");
};
