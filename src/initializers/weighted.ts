import { getBalancerContractAddress } from "@balancer-labs/v2-deployments";
import { Interface } from "@ethersproject/abi";
import { Provider } from "@ethersproject/abstract-provider";
import { Contract } from "@ethersproject/contracts";
import { formatEther, formatUnits } from "@ethersproject/units";

import WeightedPool, { IWeightedPoolToken } from "../pools/weighted";
import { getPool } from "../subgraph/index";

export const initFromOnchain = async (
  provider: Provider,
  poolId: string,
  network = "mainnet",
  query = false
): Promise<WeightedPool> => {
  const vaultInterface = new Interface([
    "function getPool(bytes32 poolId) view returns (address, uint8)",
    "function getPoolTokens(bytes32 poolId) view returns (address[], uint256[], uint256)",
  ]);
  const poolInterface = new Interface([
    "function getSwapFeePercentage() view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function getNormalizedWeights() view returns (uint256[])",
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

  // Fetch tokens information
  const [tokenAddresses, tokenBalances] = await vault.getPoolTokens(poolId);
  const tokenWeights = await pool.getNormalizedWeights();
  const numTokens = Math.min(
    tokenAddresses.length,
    tokenBalances.length,
    tokenWeights.length
  );

  const tokens: IWeightedPoolToken[] = [];
  for (let i = 0; i < numTokens; i++) {
    // Initialize token contract
    const token = new Contract(tokenAddresses[i], tokenInterface, provider);

    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const balance = formatUnits(tokenBalances[i], decimals);
    const weight = formatEther(tokenWeights[i]);

    tokens.push({
      address: token.address,
      symbol,
      balance,
      decimals,
      weight,
    });
  }

  return new WeightedPool({
    id: poolId,
    address: poolAddress,
    tokens,
    bptTotalSupply,
    swapFeePercentage,
    query,
  });
}

export const initFromSubgraph = async (
  poolId: string,
  network = "mainnet",
  query = false,
  blockNumber?: number
): Promise<WeightedPool> => {
  const pool = await getPool(poolId, blockNumber, network);
  if (!pool) {
    throw new Error("Could not fetch pool data");
  }

  if (pool.poolType !== "Weighted") {
    throw new Error("Pool must be weighted");
  }

  const id = pool.id;
  const address = pool.address;
  const bptTotalSupply = pool.totalShares;
  const swapFeePercentage = pool.swapFee;

  const tokens: IWeightedPoolToken[] = [];
  for (const token of pool.tokens) {
    tokens.push({
      address: token.address,
      symbol: token.symbol,
      balance: token.balance,
      decimals: token.decimals,
      weight: token.weight,
    });
  }

  return new WeightedPool({
    id,
    address,
    tokens,
    bptTotalSupply,
    swapFeePercentage,
    query,
  });
}