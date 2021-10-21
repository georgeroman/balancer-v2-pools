// Ported from Solidity:
// // https://github.com/balancer-labs/balancer-v2-monorepo/blob/589542001aeca5bdc120404874fe0137f6a4c749/pkg/pool-linear/contracts/LinearMath.sol

import BigNumber, { bn } from "../../utils/big-number";
import * as fp from "../../utils/math/fixed-point";
import * as math from "../../utils/math/math";

type Params = {
  fee: BigNumber;
  rate: BigNumber;
  lowerTarget: BigNumber;
  upperTarget: BigNumber;
};

export const _calcBptOutPerMainIn = (
  mainIn: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount out, so we round down overall.

  if (bptSupply.isZero()) {
    return _toNominal(mainIn, params);
  }

  const previousNominalMain = _toNominal(mainBalance, params);
  const afterNominalMain = _toNominal(fp.add(mainBalance, mainIn), params);
  const deltaNominalMain = fp.sub(afterNominalMain, previousNominalMain);
  const invariant = _calcInvariantUp(
    previousNominalMain,
    wrappedBalance,
    params
  );
  return fp.divDown(fp.mulDown(bptSupply, deltaNominalMain), invariant);
};

export const _calcBptInPerMainOut = (
  mainOut: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount in, so we round up overall.

  const previousNominalMain = _toNominal(mainBalance, params);
  const afterNominalMain = _toNominal(fp.sub(mainBalance, mainOut), params);
  const deltaNominalMain = fp.sub(previousNominalMain, afterNominalMain);
  const invariant = _calcInvariantDown(
    previousNominalMain,
    wrappedBalance,
    params
  );
  return fp.divUp(fp.mulUp(bptSupply, deltaNominalMain), invariant);
};

export const _calcWrappedOutPerMainIn = (
  mainIn: BigNumber,
  mainBalance: BigNumber,
  params: Params
): BigNumber => {
  // Amount out, so we round down overall.

  const previousNominalMain = _toNominal(mainBalance, params);
  const afterNominalMain = _toNominal(fp.add(mainBalance, mainIn), params);
  const deltaNominalMain = fp.sub(afterNominalMain, previousNominalMain);
  return fp.divDown(deltaNominalMain, params.rate);
};

export const _calcWrappedInPerMainOut = (
  mainOut: BigNumber,
  mainBalance: BigNumber,
  params: Params
): BigNumber => {
  // Amount in, so we round up overall.

  const previousNominalMain = _toNominal(mainBalance, params);
  const afterNominalMain = _toNominal(fp.sub(mainBalance, mainOut), params);
  const deltaNominalMain = fp.sub(previousNominalMain, afterNominalMain);
  return fp.divUp(deltaNominalMain, params.rate);
};

export const _calcMainInPerBptOut = (
  bptOut: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount in, so we round up overall.

  if (bptSupply.isZero()) {
    return _fromNominal(bptOut, params);
  }

  const previousNominalMain = _toNominal(mainBalance, params);
  const invariant = _calcInvariantUp(
    previousNominalMain,
    wrappedBalance,
    params
  );
  const deltaNominalMain = fp.divUp(fp.mulUp(invariant, bptOut), bptSupply);
  const afterNominalMain = fp.add(previousNominalMain, deltaNominalMain);
  const newMainBalance = _fromNominal(afterNominalMain, params);
  return fp.sub(newMainBalance, mainBalance);
};

export const _calcMainOutPerBptIn = (
  bptIn: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount out, so we round down overall.

  const previousNominalMain = _toNominal(mainBalance, params);
  const invariant = _calcInvariantDown(
    previousNominalMain,
    wrappedBalance,
    params
  );
  const deltaNominalMain = fp.divDown(fp.mulDown(invariant, bptIn), bptSupply);
  const afterNominalMain = fp.sub(previousNominalMain, deltaNominalMain);
  const newMainBalance = _fromNominal(afterNominalMain, params);
  return fp.sub(mainBalance, newMainBalance);
};

export const _calcMainOutPerWrappedIn = (
  wrappedIn: BigNumber,
  mainBalance: BigNumber,
  params: Params
): BigNumber => {
  // Amount out, so we round down overall.

  const previousNominalMain = _toNominal(mainBalance, params);
  const deltaNominalMain = fp.mulDown(wrappedIn, params.rate);
  const afterNominalMain = fp.sub(previousNominalMain, deltaNominalMain);
  const newMainBalance = _fromNominal(afterNominalMain, params);
  return fp.sub(mainBalance, newMainBalance);
};

export const _calcMainInPerWrappedOut = (
  wrappedOut: BigNumber,
  mainBalance: BigNumber,
  params: Params
): BigNumber => {
  // Amount in, so we round up overall.

  const previousNominalMain = _toNominal(mainBalance, params);
  const deltaNominalMain = fp.mulUp(wrappedOut, params.rate);
  const afterNominalMain = fp.add(previousNominalMain, deltaNominalMain);
  const newMainBalance = _fromNominal(afterNominalMain, params);
  return fp.sub(newMainBalance, mainBalance);
};

export const _calcBptOutPerWrappedIn = (
  wrappedIn: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount out, so we round down overall.

  if (bptSupply.isZero()) {
    // Return nominal DAI
    return fp.mulDown(wrappedIn, params.rate);
  }

  const nominalMain = _toNominal(mainBalance, params);
  const previousInvariant = _calcInvariantUp(
    nominalMain,
    wrappedBalance,
    params
  );

  const newWrappedBalance = fp.add(wrappedBalance, wrappedIn);
  const newInvariant = _calcInvariantDown(
    nominalMain,
    newWrappedBalance,
    params
  );

  const newBptBalance = fp.divDown(
    fp.mulDown(bptSupply, newInvariant),
    previousInvariant
  );

  return fp.sub(newBptBalance, bptSupply);
};

export const _calcBptInPerWrappedOut = (
  wrappedOut: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount in, so we round up overall.

  const nominalMain = _toNominal(mainBalance, params);
  const previousInvariant = _calcInvariantUp(
    nominalMain,
    wrappedBalance,
    params
  );

  const newWrappedBalance = fp.sub(wrappedBalance, wrappedOut);
  const newInvariant = _calcInvariantDown(
    nominalMain,
    newWrappedBalance,
    params
  );

  const newBptBalance = fp.divDown(
    fp.mulDown(bptSupply, newInvariant),
    previousInvariant
  );

  return fp.sub(bptSupply, newBptBalance);
};

export const _calcWrappedInPerBptOut = (
  bptOut: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount in, so we round up overall.

  if (bptSupply.isZero()) {
    // Return nominal DAI
    return fp.divUp(bptOut, params.rate);
  }

  const nominalMain = _toNominal(mainBalance, params);
  const previousInvariant = _calcInvariantUp(
    nominalMain,
    wrappedBalance,
    params
  );

  const newBptBalance = fp.add(bptSupply, bptOut);
  const newWrappedBalance = fp.divUp(
    fp.sub(
      fp.mulUp(fp.divUp(newBptBalance, bptSupply), previousInvariant),
      nominalMain
    ),
    params.rate
  );

  return fp.sub(newWrappedBalance, wrappedBalance);
};

export const _calcWrappedOutPerBptIn = (
  bptIn: BigNumber,
  mainBalance: BigNumber,
  wrappedBalance: BigNumber,
  bptSupply: BigNumber,
  params: Params
): BigNumber => {
  // Amount out, so we round down overall.

  const nominalMain = _toNominal(mainBalance, params);
  const previousInvariant = _calcInvariantUp(
    nominalMain,
    wrappedBalance,
    params
  );

  const newBptBalance = fp.sub(bptSupply, bptIn);
  const newWrappedBalance = fp.divUp(
    fp.sub(
      fp.mulUp(fp.divUp(newBptBalance, bptSupply), previousInvariant),
      nominalMain
    ),
    params.rate
  );

  return fp.sub(wrappedBalance, newWrappedBalance);
};

const _calcInvariantUp = (
  nominalMainBalance: BigNumber,
  wrappedBalance: BigNumber,
  params: Params
): BigNumber => {
  return fp.add(nominalMainBalance, fp.mulUp(wrappedBalance, params.rate));
};

const _calcInvariantDown = (
  nominalMainBalance: BigNumber,
  wrappedBalance: BigNumber,
  params: Params
): BigNumber => {
  return fp.add(nominalMainBalance, fp.mulDown(wrappedBalance, params.rate));
};

const _toNominal = (amount: BigNumber, params: Params): BigNumber => {
  if (amount.lt(fp.mulUp(math.sub(fp.ONE, params.fee), params.lowerTarget))) {
    return fp.divUp(amount, math.sub(fp.ONE, params.fee));
  } else if (
    amount.lt(
      math.sub(params.upperTarget, fp.mulUp(params.fee, params.lowerTarget))
    )
  ) {
    return fp.add(amount, fp.mulUp(params.fee, params.lowerTarget));
  } else {
    return fp.divUp(
      fp.add(
        amount,
        fp.mulUp(math.add(params.lowerTarget, params.upperTarget), params.fee)
      ),
      math.add(fp.ONE, params.fee)
    );
  }
};

const _fromNominal = (nominal: BigNumber, params: Params): BigNumber => {
  if (nominal.lt(params.lowerTarget)) {
    return fp.mulUp(nominal, math.sub(fp.ONE, params.fee));
  } else if (nominal.lt(params.upperTarget)) {
    return fp.sub(nominal, fp.mulUp(params.fee, params.lowerTarget));
  } else {
    return fp.sub(
      fp.mulUp(nominal, math.add(fp.ONE, params.fee)),
      fp.mulUp(params.fee, math.add(params.lowerTarget, params.upperTarget))
    );
  }
};
