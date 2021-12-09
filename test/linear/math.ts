import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import * as sdkLinearMath from "../../src/pools/linear/math";
import { scale, scaleAll } from "../../src/utils/big-number";
import { deployContract, isSameResult, toEvmBn } from "../../src/utils/test";

type Params = {
  fee: string;
  lowerTarget: string;
  upperTarget: string;
};

describe("LinearMath", () => {
  let deployer: SignerWithAddress;

  let evmLinearMath: Contract;

  before(async () => {
    [deployer] = await ethers.getSigners();

    evmLinearMath = await deployContract({
      name: "LinearMath",
      from: deployer,
    });
  });

  describe("_calcBptOutPerMainIn", () => {
    let mainIn: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcBptOutPerMainIn(
        toEvmBn(scale(mainIn, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcBptOutPerMainIn(
            scale(mainIn, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      mainIn = "1";
      mainBalance = "200";
      wrappedBalance = "30";
      bptSupply = "100";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });

    it("complex values", () => {
      mainIn = "100";
      mainBalance = "10";
      wrappedBalance = "1000";
      bptSupply = "10";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcBptInPerMainOut", () => {
    let mainOut: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcBptInPerMainOut(
        toEvmBn(scale(mainOut, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcBptInPerMainOut(
            scale(mainOut, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      mainOut = "50";
      mainBalance = "100";
      wrappedBalance = "0";
      bptSupply = "110";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcWrappedOutPerMainIn", () => {
    let mainIn: string;
    let mainBalance: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcWrappedOutPerMainIn(
        toEvmBn(scale(mainIn, 18)),
        toEvmBn(scale(mainBalance, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcWrappedOutPerMainIn(
            scale(mainIn, 18),
            scale(mainBalance, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      mainIn = "50";
      mainBalance = "500";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcWrappedInPerMainOut", () => {
    let mainOut: string;
    let mainBalance: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcWrappedInPerMainOut(
        toEvmBn(scale(mainOut, 18)),
        toEvmBn(scale(mainBalance, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcWrappedInPerMainOut(
            scale(mainOut, 18),
            scale(mainBalance, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      mainOut = "100";
      mainBalance = "600";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcMainInPerBptOut", () => {
    let bptOut: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcMainInPerBptOut(
        toEvmBn(scale(bptOut, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcMainInPerBptOut(
            scale(bptOut, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      bptOut = "100";
      mainBalance = "500";
      wrappedBalance = "200";
      bptSupply = "1000";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcMainOutPerBptIn", () => {
    let bptIn: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcMainOutPerBptIn(
        toEvmBn(scale(bptIn, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcMainOutPerBptIn(
            scale(bptIn, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      bptIn = "100";
      mainBalance = "500";
      wrappedBalance = "300";
      bptSupply = "1000";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcMainOutPerWrappedIn", () => {
    let wrappedIn: string;
    let mainBalance: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcMainOutPerWrappedIn(
        toEvmBn(scale(wrappedIn, 18)),
        toEvmBn(scale(mainBalance, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcMainOutPerWrappedIn(
            scale(wrappedIn, 18),
            scale(mainBalance, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      wrappedIn = "100";
      mainBalance = "500";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcMainInPerWrappedOut", () => {
    let wrappedOut: string;
    let mainBalance: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcMainInPerWrappedOut(
        toEvmBn(scale(wrappedOut, 18)),
        toEvmBn(scale(mainBalance, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcMainInPerWrappedOut(
            scale(wrappedOut, 18),
            scale(mainBalance, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      wrappedOut = "100";
      mainBalance = "500";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcBptOutPerWrappedIn", () => {
    let wrappedIn: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcBptOutPerWrappedIn(
        toEvmBn(scale(wrappedIn, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcBptOutPerWrappedIn(
            scale(wrappedIn, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      wrappedIn = "500";
      mainBalance = "100";
      wrappedBalance = "0";
      bptSupply = "150";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcBptInPerWrappedOut", () => {
    let wrappedOut: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcBptInPerWrappedOut(
        toEvmBn(scale(wrappedOut, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcBptInPerWrappedOut(
            scale(wrappedOut, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      wrappedOut = "10";
      mainBalance = "100";
      wrappedBalance = "100";
      bptSupply = "150";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcWrappedInPerBptOut", () => {
    let bptOut: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcWrappedInPerBptOut(
        toEvmBn(scale(bptOut, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcWrappedInPerBptOut(
            scale(bptOut, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      bptOut = "100";
      mainBalance = "150";
      wrappedBalance = "100";
      bptSupply = "250";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcWrappedOutPerBptIn", () => {
    let bptIn: string;
    let mainBalance: string;
    let wrappedBalance: string;
    let bptSupply: string;
    let params: Params;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcWrappedOutPerBptIn(
        toEvmBn(scale(bptIn, 18)),
        toEvmBn(scale(mainBalance, 18)),
        toEvmBn(scale(wrappedBalance, 18)),
        toEvmBn(scale(bptSupply, 18)),
        {
          fee: toEvmBn(scale(params.fee, 18)),
          lowerTarget: toEvmBn(scale(params.lowerTarget, 18)),
          upperTarget: toEvmBn(scale(params.upperTarget, 18)),
        }
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcWrappedOutPerBptIn(
            scale(bptIn, 18),
            scale(mainBalance, 18),
            scale(wrappedBalance, 18),
            scale(bptSupply, 18),
            {
              fee: scale(params.fee, 18),
              lowerTarget: scale(params.lowerTarget, 18),
              upperTarget: scale(params.upperTarget, 18),
            }
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      bptIn = "100";
      mainBalance = "150";
      wrappedBalance = "100";
      bptSupply = "250";
      params = {
        fee: "0.01",
        lowerTarget: "1000",
        upperTarget: "2000",
      };
    });
  });

  describe("_calcTokensOutGivenExactBptIn", () => {
    let balances: string[];
    let bptAmountIn: string;
    let bptTotalSupply: string;
    let bptIndex: number;

    afterEach(async () => {
      const evmExecution = evmLinearMath._calcTokensOutGivenExactBptIn(
        scaleAll(balances, 18).map(toEvmBn),
        toEvmBn(scale(bptAmountIn, 18)),
        toEvmBn(scale(bptTotalSupply, 18)),
        bptIndex
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkLinearMath._calcTokensOutGivenExactBptIn(
            scaleAll(balances, 18),
            scale(bptAmountIn, 18),
            scale(bptTotalSupply, 18),
            bptIndex
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("simple values", () => {
      balances = ["100", "200", "300"];
      bptAmountIn = "10";
      bptTotalSupply = "80";
      bptIndex = 1;
    });
  });
});
