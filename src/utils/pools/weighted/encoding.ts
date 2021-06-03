import { ethers } from "hardhat";

const EXACT_TOKENS_IN_FOR_BPT_OUT_TAG = 1;
const TOKEN_IN_FOR_EXACT_BPT_OUT_TAG = 2;

export type ExactTokensInForBptOut = {
  kind: "ExactTokensInForBptOut";
  amountsIn: string[];
  minimumBpt: string;
};

export type TokenInForExactBptOut = {
  kind: "TokenInForExactBptOut";
  bptOut: string;
  tokenInIndex: number;
};

export function joinUserData(
  joinData: ExactTokensInForBptOut | TokenInForExactBptOut
): string {
  if (joinData.kind == "ExactTokensInForBptOut") {
    return ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256[]", "uint256"],
      [EXACT_TOKENS_IN_FOR_BPT_OUT_TAG, joinData.amountsIn, joinData.minimumBpt]
    );
  } else {
    return ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256"],
      [TOKEN_IN_FOR_EXACT_BPT_OUT_TAG, joinData.bptOut, joinData.tokenInIndex]
    );
  }
}
