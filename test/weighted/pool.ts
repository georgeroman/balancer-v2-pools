import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

import WeightedPool, { IWeightedPoolToken } from "@pools/weighted";
import { querySwapGivenIn } from "@utils/balancer";
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
      const evmExecution = querySwapGivenIn(
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

    it("simple values", async () => {
      tokenIn = sdkPool.tokens[0];
      tokenOut = sdkPool.tokens[1];
      amountIn = "100";
    });
  });
});
