import { BigNumber, Contract, constants, utils } from "ethers";

import * as encode from "./encoding";

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

  return utils.formatUnits(result.amountOut, tokenOut.decimals);
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

  return utils.formatUnits(result.amountIn, tokenIn.decimals);
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
      utils.parseUnits(amount, tokens[i].decimals).toString()
    ),
    minimumBpt: "0",
  });

  const result = await join(helpers, poolId, tokens, userData);
  return utils.formatEther(result.bptOut);
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
    bptOut: utils.parseEther(bptOut).toString(),
    tokenInIndex,
  });

  const result = await join(helpers, poolId, tokens, userData);
  return utils.formatUnits(
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
    bptIn: utils.parseEther(bptIn).toString(),
    tokenOutIndex,
  });

  const result = await exit(helpers, poolId, tokens, userData);
  return utils.formatUnits(
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
    bptIn: utils.parseEther(bptIn).toString(),
  });

  const result = await exit(helpers, poolId, tokens, userData);
  return result.amountsOut.map((amount: BigNumber, i: number) =>
    utils.formatUnits(amount, tokens[i].decimals)
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
      utils.parseUnits(amount, tokens[i].decimals).toString()
    ),
    // Choose a value that cannot get exceeded
    maximumBpt: utils.parseEther("1000000000000000000").toString(),
  });

  const result = await exit(helpers, poolId, tokens, userData);
  return utils.formatEther(result.bptIn).toString();
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
  const [tokenInDelta, tokenOutDelta] = await vault.callStatic.queryBatchSwap(
    swapType,
    [
      {
        poolId,
        assetInIndex: 0,
        assetOutIndex: 1,
        amount:
          swapType === SwapType.GIVEN_IN
            ? utils.parseUnits(amount, tokenIn.decimals)
            : utils.parseUnits(amount, tokenOut.decimals),
        userData: "0x",
      },
    ],
    [tokenIn.address, tokenOut.address],
    {
      sender: constants.AddressZero,
      fromInternalBalance: false,
      recipient: constants.AddressZero,
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
  return helpers.callStatic.queryJoin(
    poolId,
    constants.AddressZero,
    constants.AddressZero,
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
  return helpers.callStatic.queryExit(
    poolId,
    constants.AddressZero,
    constants.AddressZero,
    {
      assets: tokens.map((t) => t.address),
      minAmountsOut,
      toInternalBalance: false,
      userData,
    }
  );
};
