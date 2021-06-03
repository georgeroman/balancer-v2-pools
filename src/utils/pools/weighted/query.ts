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
) => {
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
) => {
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
) => {
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
  return ethers.utils.formatEther(result[0]);
};

export const joinTokenInForExactBptOut = async (
  helpers: Contract,
  poolId: string,
  tokens: { [symbol: string]: string },
  tokenInSymbol: string,
  bptOut: string
) => {
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
  return ethers.utils.formatEther(result[1][tokenInIndex]);
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
  // Will return [tokenInDelta, tokenOutDelta]
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
  // Choose an amount that can never be exceeded
  const maxAmountsIn = tokenAddresses.map(() => "1000000000000000000");

  return helpers.queryJoin(poolId, ZERO_ADDRESS, ZERO_ADDRESS, {
    assets: tokenAddresses,
    maxAmountsIn,
    fromInternalBalance: false,
    userData,
  });
};
