import { utils } from "ethers";

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
    return utils.defaultAbiCoder.encode(
      ["uint256", "uint256[]", "uint256"],
      [EXACT_TOKENS_IN_FOR_BPT_OUT_TAG, joinData.amountsIn, joinData.minimumBpt]
    );
  } else {
    return utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256"],
      [TOKEN_IN_FOR_EXACT_BPT_OUT_TAG, joinData.bptOut, joinData.tokenInIndex]
    );
  }
}

const EXACT_BPT_IN_FOR_TOKEN_OUT_TAG = 0;
const EXACT_BPT_IN_FOR_TOKENS_OUT_TAG = 1;
const BPT_IN_FOR_EXACT_TOKENS_OUT_TAG = 2;

export type ExactBptInForTokenOut = {
  kind: "ExactBptInForTokenOut";
  bptIn: string;
  tokenOutIndex: number;
};

export type ExactBptInForTokensOut = {
  kind: "ExactBptInForTokensOut";
  bptIn: string;
};

export type BptInForExactTokensOut = {
  kind: "BptInForExactTokensOut";
  amountsOut: string[];
  maximumBpt: string;
};

export function exitUserData(
  exitData:
    | ExactBptInForTokenOut
    | ExactBptInForTokensOut
    | BptInForExactTokensOut
): string {
  if (exitData.kind == "ExactBptInForTokenOut") {
    return utils.defaultAbiCoder.encode(
      ["uint256", "uint256", "uint256"],
      [EXACT_BPT_IN_FOR_TOKEN_OUT_TAG, exitData.bptIn, exitData.tokenOutIndex]
    );
  } else if (exitData.kind == "ExactBptInForTokensOut") {
    return utils.defaultAbiCoder.encode(
      ["uint256", "uint256"],
      [EXACT_BPT_IN_FOR_TOKENS_OUT_TAG, exitData.bptIn]
    );
  } else {
    return utils.defaultAbiCoder.encode(
      ["uint256", "uint256[]", "uint256"],
      [
        BPT_IN_FOR_EXACT_TOKENS_OUT_TAG,
        exitData.amountsOut,
        exitData.maximumBpt,
      ]
    );
  }
}
