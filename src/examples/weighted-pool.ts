import WeightedPool from "../pools/weighted-pool";
import { bn } from "../utils/big-number";

const main = async () => {
  const pool = new WeightedPool(
    "pool",
    [
      {
        address: "token0",
        balance: bn(1000000000),
        decimals: 18,
        weight: bn(0.5),
      },
      {
        address: "token1",
        balance: bn(1000000000),
        decimals: 18,
        weight: bn(0.5),
      },
    ],
    bn(0.5),
    bn(10000000)
  );

  const poolPair = pool.getPoolPair("token0", "token1");
  console.log(pool.exactTokenInForTokenOut(poolPair, bn(10)).toString());
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
