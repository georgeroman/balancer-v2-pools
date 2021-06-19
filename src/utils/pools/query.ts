import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";

import * as encode from "@utils/pools/encoding";

export type Token = {
  address: string;
  symbol: string;
  decimals: number;
};

export enum SwapType {
  GIVEN_IN,
  GIVEN_OUT,
}

export const swapGivenIn = async (
  vault: Contract,
  poolId: string,
  tokens: Token[],
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
): Promise<string> => {
  const tokenOut = tokens.find((t) => t.symbol === tokenOutSymbol)!;

  const result = await batchSwap(
    vault,
    poolId,
    SwapType.GIVEN_IN,
    tokens,
    tokenInSymbol,
    tokenOutSymbol,
    amountIn
  );

  return ethers.utils.formatUnits(result.amountOut, tokenOut.decimals);
};

export const swapGivenOut = async (
  vault: Contract,
  poolId: string,
  tokens: Token[],
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountOut: string
): Promise<string> => {
  const tokenIn = tokens.find((t) => t.symbol === tokenInSymbol)!;

  const result = await batchSwap(
    vault,
    poolId,
    SwapType.GIVEN_OUT,
    tokens,
    tokenInSymbol,
    tokenOutSymbol,
    amountOut
  );

  return ethers.utils.formatUnits(result.amountIn, tokenIn.decimals);
};

export const joinExactTokensInForBptOut = async (
  helpers: Contract,
  poolId: string,
  tokens: Token[],
  amountsIn: string[]
): Promise<string> => {
  const userData = encode.joinUserData({
    kind: "ExactTokensInForBptOut",
    amountsIn: amountsIn.map((amount, i) =>
      ethers.utils.parseUnits(amount, tokens[i].decimals).toString()
    ),
    minimumBpt: "0",
  });

  const result = await join(helpers, poolId, tokens, userData);
  return ethers.utils.formatEther(result.bptOut);
};

export const joinTokenInForExactBptOut = async (
  helpers: Contract,
  poolId: string,
  tokens: Token[],
  tokenInSymbol: string,
  bptOut: string
): Promise<string> => {
  const tokenInIndex = tokens.findIndex((t) => t.symbol === tokenInSymbol);

  const userData = encode.joinUserData({
    kind: "TokenInForExactBptOut",
    bptOut: ethers.utils.parseEther(bptOut).toString(),
    tokenInIndex,
  });

  const result = await join(helpers, poolId, tokens, userData);
  return ethers.utils.formatUnits(
    result.amountsIn[tokenInIndex],
    tokens[tokenInIndex].decimals
  );
};

export const exitExactBptInForTokenOut = async (
  helpers: Contract,
  poolId: string,
  tokens: Token[],
  tokenOutSymbol: string,
  bptIn: string
): Promise<string> => {
  const tokenOutIndex = tokens.findIndex((t) => t.symbol === tokenOutSymbol);

  const userData = encode.exitUserData({
    kind: "ExactBptInForTokenOut",
    bptIn: ethers.utils.parseEther(bptIn).toString(),
    tokenOutIndex,
  });

  const result = await exit(helpers, poolId, tokens, userData);
  return ethers.utils.formatUnits(
    result.amountsOut[tokenOutIndex],
    tokens[tokenOutIndex].decimals
  );
};

export const exitExactBptInForTokensOut = async (
  helpers: Contract,
  poolId: string,
  tokens: Token[],
  bptIn: string
): Promise<string[]> => {
  const userData = encode.exitUserData({
    kind: "ExactBptInForTokensOut",
    bptIn: ethers.utils.parseEther(bptIn).toString(),
  });

  const result = await exit(helpers, poolId, tokens, userData);
  return result.amountsOut.map((amount: BigNumber, i: number) =>
    ethers.utils.formatUnits(amount, tokens[i].decimals)
  );
};

export const exitBptInForExactTokensOut = async (
  helpers: Contract,
  poolId: string,
  tokens: Token[],
  amountsOut: string[]
): Promise<string> => {
  const userData = encode.exitUserData({
    kind: "BptInForExactTokensOut",
    amountsOut: amountsOut.map((amount, i) =>
      ethers.utils.parseUnits(amount, tokens[i].decimals).toString()
    ),
    // Choose a value that cannot get exceeded
    maximumBpt: ethers.utils.parseEther("1000000000000000000").toString(),
  });

  const result = await exit(helpers, poolId, tokens, userData);
  return ethers.utils.formatEther(result.bptIn).toString();
};

const batchSwap = async (
  vault: Contract,
  poolId: string,
  swapType: SwapType,
  tokens: Token[],
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amount: string
) => {
  const tokenIn = tokens.find((t) => t.symbol === tokenInSymbol)!;
  const tokenOut = tokens.find((t) => t.symbol === tokenOutSymbol)!;

  // Returns: [tokenInDelta, tokenOutDelta]
  const [tokenInDelta, tokenOutDelta] = await vault.queryBatchSwap(
    swapType,
    [
      {
        poolId,
        assetInIndex: 0,
        assetOutIndex: 1,
        amount:
          swapType === SwapType.GIVEN_IN
            ? ethers.utils.parseUnits(amount, tokenIn.decimals)
            : ethers.utils.parseUnits(amount, tokenOut.decimals),
        userData: "0x",
      },
    ],
    [tokenIn.address, tokenOut.address],
    {
      sender: ethers.constants.AddressZero,
      fromInternalBalance: false,
      recipient: ethers.constants.AddressZero,
      toInternalBalance: false,
    }
  );

  return {
    amountIn: tokenInDelta,
    amountOut: tokenOutDelta.mul(-1),
  };
};

const join = async (
  helpers: Contract,
  poolId: string,
  tokens: Token[],
  userData: string
) => {
  // These values are not actually used by the helper contract
  const maxAmountsIn = tokens.map(() => "0");

  // Returns: { bptOut, amountsIn }
  return helpers.queryJoin(
    poolId,
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    {
      assets: tokens.map((t) => t.address),
      maxAmountsIn,
      fromInternalBalance: false,
      userData,
    }
  );
};

const exit = async (
  helpers: Contract,
  poolId: string,
  tokens: Token[],
  userData: string
) => {
  // These values are not actually used by the helper contract
  const minAmountsOut = tokens.map(() => "0");

  // Returns { bptIn, amountsOut }
  return helpers.queryExit(
    poolId,
    ethers.constants.AddressZero,
    ethers.constants.AddressZero,
    {
      assets: tokens.map((t) => t.address),
      minAmountsOut,
      toInternalBalance: false,
      userData,
    }
  );
};
