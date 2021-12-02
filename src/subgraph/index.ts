import { gql, request } from "graphql-request";

export const getPool = async (
  poolId: string,
  blockNumber?: number,
  network = "mainnet"
): Promise<any> => {
  const data = `
    id
    address
    poolType
    swapFee
    totalShares
    amp
    tokens {
      id
      address
      symbol
      balance
      decimals
      weight
    }
  `;

  let query: string;
  if (blockNumber) {
    query = gql`
      query getPool($poolId: ID!, $blockNumber: Int!) {
        pools(where: { id: $poolId }, block: { number: $blockNumber }) {
          ${data}
        }
      }
    `;
  } else {
    query = gql`
      query getPool($poolId: ID!) {
        pools(where: { id: $poolId }) {
          ${data}
        }
      }
    `;
  }

  let subgraphUrl: string;
  if (network === "mainnet") {
    subgraphUrl =
      "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2";
  } else {
    subgraphUrl = `https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-${network}-v2`;
  }

  const result = await request(subgraphUrl, query, { poolId, blockNumber });

  if (result && result.pools && result.pools.length) {
    return result.pools[0];
  }
  return null;
};
