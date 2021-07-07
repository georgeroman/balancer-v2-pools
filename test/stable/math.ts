import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import * as sdkStableMath from "../../src/pools/stable/math";
import { bn, scale, scaleAll } from "../../src/utils/big-number";
import { deployContract, isSameResult, toEvmBn } from "../utils";

describe("StableMath", () => {
  let deployer: SignerWithAddress;

  let evmStableMath: Contract;

  const adjustAmp = (amp: string) => bn(amp).times(sdkStableMath.AMP_PRECISION);

  before(async () => {
    [deployer] = await ethers.getSigners();

    evmStableMath = await deployContract({
      name: "StableMath",
      from: deployer,
    });
  });

  describe("_calculateInvariant", () => {
    let amplificationParameter: string;
    let balances: string[];

    afterEach(async () => {
      // Randomize the `roundUp` parameter
      const roundUp = !!Math.round(Math.random());

      const evmExecution = evmStableMath._calculateInvariant(
        toEvmBn(adjustAmp(amplificationParameter)),
        scaleAll(balances, 18).map(toEvmBn),
        roundUp
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calculateInvariant(
            adjustAmp(amplificationParameter),
            scaleAll(balances, 18),
            roundUp
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("two tokens", () => {
      amplificationParameter = "100";
      balances = ["1000", "1200"];
    });

    it("three tokens", () => {
      amplificationParameter = "50";
      balances = ["1000", "1000", "2000"];
    });

    it("empty invariant", () => {
      amplificationParameter = "99";
      balances = [];
    });
  });

  describe("_calcOutGivenIn", () => {
    let amplificationParameter: string;
    let balances: string[];
    let tokenIndexIn: number;
    let tokenIndexOut: number;
    let tokenAmountIn: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcOutGivenIn(
        toEvmBn(adjustAmp(amplificationParameter)),
        scaleAll(balances, 18).map(toEvmBn),
        tokenIndexIn,
        tokenIndexOut,
        toEvmBn(scale(tokenAmountIn, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcOutGivenIn(
            adjustAmp(amplificationParameter),
            scaleAll(balances, 18),
            tokenIndexIn,
            tokenIndexOut,
            scale(tokenAmountIn, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("two tokens", () => {
      amplificationParameter = "760";
      balances = ["1000", "1200"];
      tokenIndexIn = 0;
      tokenIndexOut = 1;
      tokenAmountIn = "100";
    });

    it("three tokens", () => {
      amplificationParameter = "200";
      balances = ["1000", "1000", "1000"];
      tokenIndexIn = 1;
      tokenIndexOut = 2;
      tokenAmountIn = "485";
    });
  });

  describe("_calcInGivenOut", () => {
    let amplificationParameter: string;
    let balances: string[];
    let tokenIndexIn: number;
    let tokenIndexOut: number;
    let tokenAmountOut: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcOutGivenIn(
        toEvmBn(adjustAmp(amplificationParameter)),
        scaleAll(balances, 18).map(toEvmBn),
        tokenIndexIn,
        tokenIndexOut,
        toEvmBn(scale(tokenAmountOut, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcOutGivenIn(
            adjustAmp(amplificationParameter),
            scaleAll(balances, 18),
            tokenIndexIn,
            tokenIndexOut,
            scale(tokenAmountOut, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("two tokens", () => {
      amplificationParameter = "1000";
      balances = ["1000", "1200"];
      tokenIndexIn = 1;
      tokenIndexOut = 0;
      tokenAmountOut = "100";
    });

    it("three tokens", () => {
      amplificationParameter = "500";
      balances = ["10000", "15000", "20000"];
      tokenIndexIn = 0;
      tokenIndexOut = 2;
      tokenAmountOut = "500";
    });
  });

  describe("_calcBptOutGivenExactTokensIn", () => {
    let amp: string;
    let balances: string[];
    let amountsIn: string[];
    let bptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcBptOutGivenExactTokensIn(
        toEvmBn(adjustAmp(amp)),
        scaleAll(balances, 18).map(toEvmBn),
        scaleAll(amountsIn, 18).map(toEvmBn),
        toEvmBn(scale(bptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcBptOutGivenExactTokensIn(
            adjustAmp(amp),
            scaleAll(balances, 18),
            scaleAll(amountsIn, 18),
            scale(bptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      amp = "99";
      balances = ["100", "200", "300"];
      amountsIn = ["50", "100", "100"];
      bptTotalSupply = "1000";
      swapFee = "0.01";
    });
  });

  describe("_calcTokenInGivenExactBptOut", () => {
    let amp: string;
    let balances: string[];
    let tokenIndex: number;
    let bptAmountOut: string;
    let bptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcTokenInGivenExactBptOut(
        toEvmBn(adjustAmp(amp)),
        scaleAll(balances, 18).map(toEvmBn),
        tokenIndex,
        toEvmBn(scale(bptAmountOut, 18)),
        toEvmBn(scale(bptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcTokenInGivenExactBptOut(
            adjustAmp(amp),
            scaleAll(balances, 18),
            tokenIndex,
            scale(bptAmountOut, 18),
            scale(bptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      amp = "100";
      balances = ["100", "200", "300"];
      tokenIndex = 1;
      bptAmountOut = "10";
      bptTotalSupply = "1000";
      swapFee = "0.05";
    });
  });

  describe("_calcBptInGivenExactTokensOut", () => {
    let amp: string;
    let balances: string[];
    let amountsOut: string[];
    let bptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcBptInGivenExactTokensOut(
        toEvmBn(adjustAmp(amp)),
        scaleAll(balances, 18).map(toEvmBn),
        scaleAll(amountsOut, 18).map(toEvmBn),
        toEvmBn(scale(bptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcBptInGivenExactTokensOut(
            adjustAmp(amp),
            scaleAll(balances, 18),
            scaleAll(amountsOut, 18),
            scale(bptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      amp = "23";
      balances = ["10", "50", "60"];
      amountsOut = ["50", "100", "100"];
      bptTotalSupply = "100";
      swapFee = "0.1";
    });
  });

  describe("_calcTokenOutGivenExactBptIn", () => {
    let amp: string;
    let balances: string[];
    let tokenIndex: number;
    let bptAmountIn: string;
    let bptTotalSupply: string;
    let swapFee: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcTokenOutGivenExactBptIn(
        toEvmBn(adjustAmp(amp)),
        scaleAll(balances, 18).map(toEvmBn),
        tokenIndex,
        toEvmBn(scale(bptAmountIn, 18)),
        toEvmBn(scale(bptTotalSupply, 18)),
        toEvmBn(scale(swapFee, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcTokenOutGivenExactBptIn(
            adjustAmp(amp),
            scaleAll(balances, 18),
            tokenIndex,
            scale(bptAmountIn, 18),
            scale(bptTotalSupply, 18),
            scale(swapFee, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      amp = "100";
      balances = ["10", "11", "12", "13", "14"];
      tokenIndex = 3;
      bptAmountIn = "10";
      bptTotalSupply = "100";
      swapFee = "0.1";
    });
  });

  describe("_calcTokensOutGivenExactBptIn", () => {
    let balances: string[];
    let bptAmountIn: string;
    let bptTotalSupply: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcTokensOutGivenExactBptIn(
        scaleAll(balances, 18).map(toEvmBn),
        toEvmBn(scale(bptAmountIn, 18)),
        toEvmBn(scale(bptTotalSupply, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcTokensOutGivenExactBptIn(
            scaleAll(balances, 18),
            scale(bptAmountIn, 18),
            scale(bptTotalSupply, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balances = ["100", "1000", "5000"];
      bptAmountIn = "27";
      bptTotalSupply = "200";
    });
  });

  describe("_calcDueTokenProtocolSwapFeeAmount", () => {
    let amplificationParameter: string;
    let balances: string[];
    let lastInvariant: string;
    let tokenIndex: number;
    let protocolSwapFeePercentage: string;

    afterEach(async () => {
      const evmExecution = evmStableMath._calcDueTokenProtocolSwapFeeAmount(
        toEvmBn(adjustAmp(amplificationParameter)),
        scaleAll(balances, 18).map(toEvmBn),
        toEvmBn(scale(lastInvariant, 18)),
        tokenIndex,
        toEvmBn(scale(protocolSwapFeePercentage, 18))
      );
      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calcDueTokenProtocolSwapFeeAmount(
            adjustAmp(amplificationParameter),
            scaleAll(balances, 18),
            scale(lastInvariant, 18),
            tokenIndex,
            scale(protocolSwapFeePercentage, 18)
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("two tokens", () => {
      amplificationParameter = "95";
      balances = ["100", "150"];
      lastInvariant = "100";
      tokenIndex = 0;
      protocolSwapFeePercentage = "0.1";
    });

    it("three tokens", () => {
      amplificationParameter = "100";
      balances = ["1000", "1500", "2000"];
      lastInvariant = "1000";
      tokenIndex = 2;
      protocolSwapFeePercentage = "0.2";
    });
  });
});
