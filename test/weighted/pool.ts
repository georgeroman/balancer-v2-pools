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

    it("invalid weights", () => {
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
  });
});
