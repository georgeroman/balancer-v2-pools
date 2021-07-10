<div align="center">
  <h2><code>balancer-v2-pools</code></h2>
</div>

<br/>

Simple SDK for simulating the exact on-chain behaviour of various Balancer v2 pools.

[![NPM](https://nodei.co/npm/@georgeroman/balancer-v2-pools.png?mini=true)](https://www.npmjs.com/package/@georgeroman/balancer-v2-pools)

### Usage instructions

```typescript
import { WeightedPool } from "@georgeroman/balancer-v2-pools";

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

Mainnet forking is used for testing in order to make sure the SDK exactly match the EVM. Make sure to have a `.env` file in the root directory, containing the following definitions (the given block number must include the instances of the pools used in the tests):

```bash
RPC_URL=
BLOCK_NUMBER=
```

The setup I recommend for deterministic tests is the following:

```bash
RPC_URL=https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}
BLOCK_NUMBER=12797724
```

To execute the tests locally, simply run:

```bash
# Install dependencies
npm install

# Run tests
npm test
```
