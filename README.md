<div align="center">
  <h2><code>balancer-v2-pools</code></h2>
</div>

<br/>

Simple SDK for simulating the exact on-chain behaviour of various Balancer v2 pools.

### Setup instructions

Mainnet forking is used for testing in order to make sure the SDK exactly match the EVM. Make sure to have a `.env` file in the root directory, containing the following:

```bash
ALCHEMY_KEY=
BLOCK_NUMBER=
```

To execute the tests locally, simply run:

```bash
# Install dependencies
npm install

# Run tests
npm test
```
