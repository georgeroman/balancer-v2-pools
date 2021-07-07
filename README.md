<div align="center">
  <h2><code>balancer-v2-pools</code></h2>
</div>

<br/>

Simple SDK for simulating the exact on-chain behaviour of various Balancer v2 pools.

### Usage instructions

```typescript
const pool = await WeightedPool.initFromRealPool(
  // WETH/DAI 60/40 on Mainnet
  "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a"
);

// Swap
const amountOut = pool.swapGivenIn("WETH", "DAI", "100");

// Join
const bptOut = pool.joinExactTokensInForBptOut({
  WETH: "1",
  DAI: "2000",
});

// Exit
const tokensOut = pool.exitExactBptInForTokensOut("1.23");
```

### Setup instructions

Mainnet forking is used for testing in order to make sure the SDK exactly match the EVM. Make sure to have a `.env` file in the root directory, containing the following:

```bash
RPC_URL=
BLOCK_NUMBER=
```

The setup I recommend for deterministic tests is the following:

For Mainnet (eg. weighted pools):

```bash
RPC_URL=https://eth-mainnet.alchemyapi.io/v2/ALCHEMY_KEY
BLOCK_NUMBER=12552900
```

For Kovan (eg. stable pools):

```bash
RPC_URL=https://eth-kovan.alchemyapi.io/v2/ALCHEMY_KEY
BLOCK_NUMBER=25880708
```

To execute the tests locally, simply run:

```bash
# Install dependencies
npm install

# Run tests
npm test
```

Note that for now, the stable pool tests use Kovan instances, while the weighted pool tests use Mainnet instances. Since we're using network forking for running the tests, this implies that it's not possible to run the stable pool and weighted pool tests at the same time. Once the stable pool get deployed to Mainnet, this will get fixed but in the meantime you have to use different `.env` files, one linking to Kovan and another linking to Mainnet.

To execute selected tests only, run:

```bash
npm test -- ./test/weighted/math.ts ./test/weighted/pool.ts
```
