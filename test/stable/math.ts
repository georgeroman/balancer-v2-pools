import { Contract } from "@ethersproject/contracts";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

import * as sdkStableMath from "@pools/stable/math";
import { bn, scale, scaleAll } from "@utils/big-number";
import { deployContract, toEvmBn } from "@utils/evm";
import { isSameResult } from "@utils/test";

describe("StableMath", () => {
  let deployer: SignerWithAddress;

  let evmStableMath: Contract;

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
        toEvmBn(bn(amplificationParameter)),
        scaleAll(balances, 18).map(toEvmBn),
        roundUp
      );

      const sdkExecution = new Promise((resolve) =>
        resolve(
          sdkStableMath._calculateInvariant(
            bn(amplificationParameter),
            scaleAll(balances, 18),
            roundUp
          )
        )
      );

      expect(await isSameResult(sdkExecution, evmExecution)).to.be.true;
    });

    it("two tokens", () => {
      amplificationParameter = "100000";
      balances = ["1000", "1200"];
    });

    it("three tokens", () => {
      amplificationParameter = "50000";
      balances = ["1000", "1000", "2000"];
    });

    it("empty invariant", () => {
      amplificationParameter = "99000";
      balances = [];
    });
  });
});
