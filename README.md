<div align="center">
  <h2><code>balancer-v2-pools</code></h2>
</div>

<br/>

Simple SDK for simulating the exact on-chain behaviour of various Balancer v2 pools.

[![NPM](https://nodei.co/npm/@georgeroman/balancer-v2-pools.png?mini=true)](https://www.npmjs.com/package/@georgeroman/balancer-v2-pools)

### Install instructions

In order to keep things as lean as possible, all dependencies of this package are marked as peer dependencies. In order to only use the math functions provided by this package (eg. `WeightedMath`, `StableMath`, `LinearMath`), it's not required to install any of these peer dependencies. However, for using the high-level pool classes/helpers all peer dependencies must get installed (eg. via [npm-install-peers](https://www.npmjs.com/package/npm-install-peers)).

### Usage instructions

```typescript
import { JsonRpcProvider } from "@ethersproject/providers";
import { WeightedPool } from "@georgeroman/balancer-v2-pools";

const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT);

// WETH/DAI 60/40 on Mainnet
const pool = await WeightedPool.initFromOnchain(
  provider,
  "0x0b09dea16768f0799065c475be02919503cb2a3500020000000000000000001a",
  "mainnet"
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
BLOCK_NUMBER=13128465
```

To execute the tests locally, simply run:

```bash
# Install dependencies
npm install

# Run tests
npm test
```
