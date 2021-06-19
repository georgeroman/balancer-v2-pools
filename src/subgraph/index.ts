import { gql, request } from "graphql-request";

export const getPool = async (
  poolId: string,
  blockNumber?: number,
  testnet?: boolean
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

  const result = await request(
    testnet
      ? "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan-v2"
      : "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2",
    query,
    { poolId, blockNumber }
  );

  if (result && result.pools && result.pools.length) {
    return result.pools[0];
  }
  return null;
};
