import { getBalancerContractAddress } from "@balancer-labs/v2-deployments";
import { Interface } from "@ethersproject/abi";
import { Provider } from "@ethersproject/abstract-provider";
import { Contract } from "@ethersproject/contracts";
import { formatEther, formatUnits } from "@ethersproject/units";

import StablePool, { IStablePoolToken } from "../pools/stable";
import { getPool } from "../subgraph/index";

// ---------------------- On-chain initializer ----------------------

export const initFromOnchain = async (
  provider: Provider,
  poolId: string,
  network = "mainnet",
  query = false
): Promise<StablePool> => {
  const vaultInterface = new Interface([
    "function getPool(bytes32 poolId) view returns (address, uint8)",
    "function getPoolTokens(bytes32 poolId) view returns (address[], uint256[], uint256)",
  ]);
  const poolInterface = new Interface([
    "function getSwapFeePercentage() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function getAmplificationParameter() view returns (uint256, bool, uint256)",
  ]);
  const tokenInterface = new Interface([
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ]);

  // Initialize vault contract
  const vaultAddress = await getBalancerContractAddress(
    "20210418-vault",
    "Vault",
    network
  );
  const vault = new Contract(vaultAddress, vaultInterface, provider);

  // Initialize pool contract
  const [poolAddress] = await vault.getPool(poolId);
  const pool = new Contract(poolAddress, poolInterface, provider);

  // Fetch pool information
  const bptTotalSupply = formatEther(await pool.totalSupply());
  const swapFeePercentage = formatEther(await pool.getSwapFeePercentage());
  const [ampValue, , ampPrecision] = await pool.getAmplificationParameter();
  const amplificationParameter = ampValue.div(ampPrecision).toString();

  // Fetch tokens information
  const [tokenAddresses, tokenBalances] = await vault.getPoolTokens(poolId);
  const numTokens = Math.min(tokenAddresses.length, tokenBalances.length);

  const tokens: IStablePoolToken[] = [];
  for (let i = 0; i < numTokens; i++) {
    // Initialize token contract
    const token = new Contract(tokenAddresses[i], tokenInterface, provider);

    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const balance = formatUnits(tokenBalances[i], decimals);

    tokens.push({
      address: token.address,
      symbol,
      balance,
      decimals,
    });
  }

  return new StablePool({
    id: poolId,
    address: poolAddress,
    tokens,
    bptTotalSupply,
    swapFeePercentage,
    amplificationParameter,
    query,
  });
};

export const initFromSubgraph = async (
  poolId: string,
  network = "mainnet",
  query = false,
  blockNumber?: number
): Promise<StablePool> => {
  const pool = await getPool(poolId, blockNumber, network);
  if (!pool) {
    throw new Error("Could not fetch pool data");
  }

  if (pool.poolType !== "Stable") {
    throw new Error("Pool must be stable");
  }

  const id = pool.id;
  const address = pool.address;
  const bptTotalSupply = pool.totalShares;
  const swapFeePercentage = pool.swapFee;
  const amplificationParameter = pool.amp;

  const tokens: IStablePoolToken[] = [];
  for (const token of pool.tokens) {
    tokens.push({
      address: token.address,
      symbol: token.symbol,
      balance: token.balance,
      decimals: token.decimals,
    });
  }

  return new StablePool({
    id,
    address,
    tokens,
    bptTotalSupply,
    swapFeePercentage,
    amplificationParameter,
    query,
  });
};
