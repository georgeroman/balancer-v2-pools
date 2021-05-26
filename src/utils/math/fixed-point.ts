// Ported from Solidity:
// https://github.com/balancer-labs/balancer-core-v2/blob/70843e6a61ad11208c1cfabf5cfe15be216ca8d3/pkg/solidity-utils/contracts/math/FixedPoint.sol

import BigNumber from "../big-number";
import * as logExp from "./log-exp";

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber("1000000000000000000"); // 10^18

export const MAX_POW_RELATIVE_ERROR = new BigNumber(10000); // 10^(-14)

export const add = (a: BigNumber, b: BigNumber): BigNumber => {
  // Fixed Point addition is the same as regular checked addition
  return a.plus(b);
};

export const sub = (a: BigNumber, b: BigNumber): BigNumber => {
  // Fixed Point subtraction is the same as regular checked subtraction
  return a.minus(b);
};

export const mulDown = (a: BigNumber, b: BigNumber): BigNumber => {
  return a.times(b).idiv(ONE);
};

export const mulUp = (a: BigNumber, b: BigNumber): BigNumber => {
  const product = a.times(b);
  if (product.isZero()) {
    return product;
  } else {
    // The traditional divUp formula is:
    // divUp(x, y) := (x + y - 1) / y
    // To avoid intermediate overflow in the addition, we distribute the division and get:
    // divUp(x, y) := (x - 1) / y + 1
    // Note that this requires x != 0, which we already tested for

    return product.minus(new BigNumber(1)).idiv(ONE).plus(new BigNumber(1));
  }
};

export const divDown = (a: BigNumber, b: BigNumber): BigNumber => {
  if (a.isZero()) {
    return a;
  } else {
    return a.times(ONE).idiv(b);
  }
};

export const divUp = (a: BigNumber, b: BigNumber): BigNumber => {
  if (a.isZero()) {
    return a;
  } else {
    // The traditional divUp formula is:
    // divUp(x, y) := (x + y - 1) / y
    // To avoid intermediate overflow in the addition, we distribute the division and get:
    // divUp(x, y) := (x - 1) / y + 1
    // Note that this requires x != 0, which we already tested for.

    return a.times(ONE).minus(new BigNumber(1)).idiv(b).plus(new BigNumber(1));
  }
};

export const powDown = (x: BigNumber, y: BigNumber): BigNumber => {
  const raw = logExp.pow(x, y);
  const maxError = add(mulUp(raw, MAX_POW_RELATIVE_ERROR), new BigNumber(1));

  if (raw.lt(maxError)) {
    return new BigNumber(0);
  } else {
    return sub(raw, maxError);
  }
};

export const powUp = (x: BigNumber, y: BigNumber): BigNumber => {
  const raw = logExp.pow(x, y);
  const maxError = add(mulUp(raw, MAX_POW_RELATIVE_ERROR), new BigNumber(1));

  return add(raw, maxError);
};

export const complement = (x: BigNumber): BigNumber => {
  return x.lt(ONE) ? ONE.minus(x) : new BigNumber(0);
};
