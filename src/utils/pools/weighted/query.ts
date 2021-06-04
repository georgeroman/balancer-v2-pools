import { Contract } from "ethers";
import { ethers } from "hardhat";

import { mapsToOrderedLists } from "@utils/common";
import * as encode from "@utils/pools/weighted/encoding";

export const swapGivenIn = async (
  vault: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
): Promise<string> => {
  const result = await queryBatchSwap(
    vault,
    poolId,
    0,
    tokens,
    tokenInSymbol,
    tokenOutSymbol,
    amountIn
  );

  return ethers.utils.formatEther(result[1].mul(-1));
};

export const swapGivenOut = async (
  vault: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
): Promise<string> => {
  const result = await queryBatchSwap(
    vault,
    poolId,
    1,
    tokens,
    tokenInSymbol,
    tokenOutSymbol,
    amountIn
  );

  return ethers.utils.formatEther(result[0]);
};

export const joinExactTokensInForBptOut = async (
  helpers: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  amountsIn: { [symbol: string]: string }
): Promise<string> => {
  const [tokenAddresses, tokenAmountsIn] = mapsToOrderedLists(
    tokens,
    amountsIn
  );

  const userData = encode.joinUserData({
    kind: "ExactTokensInForBptOut",
    amountsIn: tokenAmountsIn.map((a) => ethers.utils.parseEther(a).toString()),
    minimumBpt: "0",
  });

  const result = await queryJoin(helpers, poolId, tokenAddresses, userData);
  return ethers.utils.formatEther(result.bptOut);
};

export const joinTokenInForExactBptOut = async (
  helpers: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  tokenInSymbol: string,
  bptOut: string
): Promise<string> => {
  const [tokenAddresses] = mapsToOrderedLists(tokens);
  const tokenInIndex = tokenAddresses.findIndex(
    (a) => a === tokens[tokenInSymbol]
  );

  const userData = encode.joinUserData({
    kind: "TokenInForExactBptOut",
    bptOut: ethers.utils.parseEther(bptOut).toString(),
    tokenInIndex,
  });

  const result = await queryJoin(helpers, poolId, tokenAddresses, userData);
  return ethers.utils.formatEther(result.amountsIn[tokenInIndex]);
};

export const exitExactBptInForTokenOut = async (
  helpers: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  tokenOutSymbol: string,
  bptIn: string
): Promise<string> => {
  const [tokenAddresses] = mapsToOrderedLists(tokens);
  const tokenOutIndex = tokenAddresses.findIndex(
    (a) => a === tokens[tokenOutSymbol]
  );

  const userData = encode.exitUserData({
    kind: "ExactBptInForTokenOut",
    bptIn: ethers.utils.parseEther(bptIn).toString(),
    tokenOutIndex,
  });

  const result = await queryExit(helpers, poolId, tokenAddresses, userData);
  return ethers.utils.formatEther(result.amountsOut[tokenOutIndex]);
};

export const exitExactBptInForTokensOut = async (
  helpers: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  bptIn: string
): Promise<string[]> => {
  const [tokenAddresses] = mapsToOrderedLists(tokens);

  const userData = encode.exitUserData({
    kind: "ExactBptInForTokensOut",
    bptIn: ethers.utils.parseEther(bptIn).toString(),
  });

  const result = await queryExit(helpers, poolId, tokenAddresses, userData);
  return result.amountsOut.map(ethers.utils.formatEther);
};

export const exitBptInForExactTokensOut = async (
  helpers: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  amountsOut: { [symbol: string]: string }
): Promise<string> => {
  const [tokenAddresses, tokenAmountsOut] = mapsToOrderedLists(
    tokens,
    amountsOut
  );

  const userData = encode.exitUserData({
    kind: "BptInForExactTokensOut",
    amountsOut: tokenAmountsOut.map((a) =>
      ethers.utils.parseEther(a).toString()
    ),
    // Choose a value that cannot get exceeded
    maximumBpt: ethers.utils.parseEther("1000000000000000000").toString(),
  });

  const result = await queryExit(helpers, poolId, tokenAddresses, userData);
  return ethers.utils.formatEther(result.bptIn).toString();
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const queryBatchSwap = async (
  vault: Contract,
  poolId: string,
  // 0 - GIVEN_IN, 1 - GIVEN_OUT
  swapType: number,
  tokens: { [symbol: string]: string },
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
) => {
  // Returns: [tokenInDelta, tokenOutDelta]
  return vault.queryBatchSwap(
    swapType,
    [
      {
        poolId,
        assetInIndex: 0,
        assetOutIndex: 1,
        amount: ethers.utils.parseEther(amountIn),
        userData: "0x",
      },
    ],
    [tokens[tokenInSymbol], tokens[tokenOutSymbol]],
    {
      sender: ZERO_ADDRESS,
      fromInternalBalance: false,
      recipient: ZERO_ADDRESS,
      toInternalBalance: false,
    }
  );
};

const queryJoin = async (
  helpers: Contract,
  poolId: string,
  tokenAddresses: string[],
  userData: string
) => {
  // These values are not actually used by the helper contract
  const maxAmountsIn = tokenAddresses.map(() => "0");

  // Returns: { bptOut, amountsIn }
  return helpers.queryJoin(poolId, ZERO_ADDRESS, ZERO_ADDRESS, {
    assets: tokenAddresses,
    maxAmountsIn,
    fromInternalBalance: false,
    userData,
  });
};

const queryExit = async (
  helpers: Contract,
  poolId: string,
  tokenAddresses: string[],
  userData: string
) => {
  // These values are not actually used by the helper contract
  const minAmountsOut = tokenAddresses.map(() => "0");

  // Returns { bptIn, amountsOut }
  return helpers.queryExit(poolId, ZERO_ADDRESS, ZERO_ADDRESS, {
    assets: tokenAddresses,
    minAmountsOut,
    toInternalBalance: false,
    userData,
  });
};
