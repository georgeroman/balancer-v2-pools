import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import WeightedPool, { IWeightedPoolToken } from "@pools/weighted";
import * as query from "@utils/balancer-query";
import { bn } from "@utils/big-number";
import { isSameResult } from "@utils/test";

describe("WeightedPool", () => {
  let sdkPool: WeightedPool;
  let evmVault: Contract;

  before(async () => {
    sdkPool = await WeightedPool.initFromRealPool(
      // WETH/DAI 60/40
      "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
      true,
      Number(process.env.BLOCK_NUMBER)
    );

    const {
      abi,
      address,
    } = require("@balancer-labs/v2-deployments/deployed/mainnet/Vault.json");

    evmVault = await ethers.getContractAt(abi, address);

    // For some reason, the actual on-chain swap fee differs from what is
    // returned from the subgraph, so to make the tests pass we update the
    // swap fee to what is on-chain

    const iface = new ethers.utils.Interface([
      "function getSwapFeePercentage() view returns (uint256)",
    ]);
    const rawSwapFeePercentage = await ethers.provider.call({
      to: sdkPool.address,
      data: iface.encodeFunctionData("getSwapFeePercentage"),
    });
    const swapFeePercentage = ethers.utils.formatEther(
      iface
        .decodeFunctionResult("getSwapFeePercentage", rawSwapFeePercentage)
        .toString()
    );

    sdkPool.setSwapFeePercentage(swapFeePercentage);
  });

  describe("swapGivenIn", () => {
    let tokenIn: IWeightedPoolToken;
    let tokenOut: IWeightedPoolToken;
    let amountIn: string;

    afterEach(async () => {
      const evmExecution = query.swapGivenIn(
        evmVault,
        sdkPool.id,
        {
          [tokenIn.symbol]: tokenIn.address,
          [tokenOut.symbol]: tokenOut.address,
        },
        tokenIn.symbol,
        tokenOut.symbol,
        amountIn
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(sdkPool.swapGivenIn(tokenIn.symbol, tokenOut.symbol, amountIn))
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenIn = sdkPool.tokens[0];
      tokenOut = sdkPool.tokens[1];
      // 0.1% of the balance
      amountIn = bn(tokenIn.balance).div(1000).toString();
    });

    it("extreme values", () => {
      tokenIn = sdkPool.tokens[1];
      tokenOut = sdkPool.tokens[0];
      // 50% of the balance
      amountIn = bn(tokenIn.balance).div(2).toString();
    });
  });

  describe("swapGivenOut", () => {
    let tokenIn: IWeightedPoolToken;
    let tokenOut: IWeightedPoolToken;
    let amountOut: string;

    afterEach(async () => {
      const evmExecution = query.swapGivenOut(
        evmVault,
        sdkPool.id,
        {
          [tokenIn.symbol]: tokenIn.address,
          [tokenOut.symbol]: tokenOut.address,
        },
        tokenIn.symbol,
        tokenOut.symbol,
        amountOut
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkPool.swapGivenOut(tokenIn.symbol, tokenOut.symbol, amountOut)
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      tokenIn = sdkPool.tokens[0];
      tokenOut = sdkPool.tokens[1];
      // 0.1% of the balance
      amountOut = bn(tokenOut.balance).div(1000).toString();
    });

    it("extreme values", () => {
      tokenIn = sdkPool.tokens[1];
      tokenOut = sdkPool.tokens[0];
      // 50% of the balance
      amountOut = bn(tokenOut.balance).div(2).toString();
    });
  });
});
