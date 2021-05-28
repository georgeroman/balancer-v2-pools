import { expect } from "chai";

import WeightedPool from "../../src/pools/weighted";

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
});
