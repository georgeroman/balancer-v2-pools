import { Contract } from "ethers";
import { ethers } from "hardhat";

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
