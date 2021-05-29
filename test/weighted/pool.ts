import { expect } from "chai";

import WeightedPool from "../../src/pools/weighted";
import * as sdkWeightedMath from "../../src/pools/weighted/math";
import { bn, scale } from "../../src/utils/big-number";
import {
  addSwapFeePercentage,
  subtractSwapFeePercentage,
} from "../../src/utils/pool";

describe("WeightedPool", () => {
  describe("constructor", () => {
    it("too few tokens", () => {
      expect(
        () =>
          new WeightedPool({
            name: "pool",
            tokens: [],
            bptTotalSupply: "1000",
            swapFeePercentage: "0.001",
          })
      ).to.throw("MIN_TOKENS");
    });

    it("too many tokens", () => {
      expect(
        () =>
          new WeightedPool({
            name: "pool",
            tokens: Array(10).fill({
              name: "token",
              balance: "1000",
              decimals: 18,
              weight: "0.1",
            }),
            bptTotalSupply: "1000",
            swapFeePercentage: "0.001",
          })
      ).to.throw("MAX_TOKENS");
    });

    it("wrong normalized weight invariant", () => {
      expect(
        () =>
          new WeightedPool({
            name: "pool",
            tokens: Array(5).fill({
              name: "token",
              balance: "1000",
              decimals: 18,
              weight: "0.1",
            }),
            bptTotalSupply: "1000",
            swapFeePercentage: "0.001",
          })
      ).to.throw("NORMALIZED_WEIGHT_INVARIANT");
    });

    it("weight too low", () => {
      expect(
        () =>
          new WeightedPool({
            name: "pool",
            tokens: [
              {
                name: "token",
                balance: "1000",
                decimals: 18,
                weight: "0.9999",
              },
              {
                name: "token",
                balance: "1000",
                decimals: 18,
                weight: "0.0001",
              },
            ],
            bptTotalSupply: "1000",
            swapFeePercentage: "0.001",
          })
      ).to.throw("MIN_WEIGHT");
    });

    it("fee too low", () => {
      expect(
        () =>
          new WeightedPool({
            name: "pool",
            tokens: Array(5).fill({
              name: "token",
              balance: "1000",
              decimals: 18,
              weight: "0.2",
            }),
            bptTotalSupply: "1000",
            swapFeePercentage: "0.0000001",
          })
      ).to.throw("MIN_SWAP_FEE_PERCENTAGE");
    });

    it("fee too high", () => {
      expect(
        () =>
          new WeightedPool({
            name: "pool",
            tokens: Array(5).fill({
              name: "token",
              balance: "1000",
              decimals: 18,
              weight: "0.2",
            }),
            bptTotalSupply: "1000",
            swapFeePercentage: "10",
          })
      ).to.throw("MAX_SWAP_FEE_PERCENTAGE");
    });
  });

  describe("swapGivenIn", () => {
    const DAI = {
      name: "DAI",
      balance: "30000000",
      decimals: 18,
      weight: "0.4",
    };
    const ETH = {
      name: "ETH",
      balance: "10000",
      decimals: 18,
      weight: "0.6",
    };

    it("swap fee is deducted from amount in", () => {
      const pool = new WeightedPool({
        name: "pool",
        tokens: [DAI, ETH],
        bptTotalSupply: "1000",
        swapFeePercentage: "0.01",
        query: true,
      });

      const amountIn = "10";
      const amountOut = pool.swapGivenIn(DAI.name, ETH.name, amountIn);

      const amountOutExpected = scale(
        sdkWeightedMath._calcOutGivenIn(
          scale(DAI.balance, DAI.decimals),
          scale(DAI.weight, 18),
          scale(ETH.balance, ETH.decimals),
          scale(ETH.weight, 18),
          subtractSwapFeePercentage(
            scale(amountIn, DAI.decimals),
            scale(pool.swapFeePercentage, 18)
          )
        ),
        -18
      ).toString();

      expect(amountOut).to.be.equal(amountOutExpected);
    });
  });

  describe("swapGivenOut", () => {
    const DAI = {
      name: "DAI",
      balance: "30000000",
      decimals: 18,
      weight: "0.5",
    };
    const ETH = {
      name: "ETH",
      balance: "10000",
      decimals: 18,
      weight: "0.5",
    };

    it("swap fee is added to amount in", () => {
      const pool = new WeightedPool({
        name: "pool",
        tokens: [DAI, ETH],
        bptTotalSupply: "1000",
        swapFeePercentage: "0.01",
        query: true,
      });

      const amountOut = "10";
      const amountIn = pool.swapGivenOut(DAI.name, ETH.name, amountOut);
      const amountInExpected = scale(
        addSwapFeePercentage(
          sdkWeightedMath._calcInGivenOut(
            scale(DAI.balance, DAI.decimals),
            scale(DAI.weight, 18),
            scale(ETH.balance, ETH.decimals),
            scale(ETH.weight, 18),
            scale(amountOut, ETH.decimals)
          ),
          scale(pool.swapFeePercentage, 18)
        ),
        -18
      ).toString();

      expect(amountIn).to.be.equal(amountInExpected);
    });
  });
});
