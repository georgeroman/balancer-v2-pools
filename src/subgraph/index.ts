import { gql, request } from "graphql-request";

export const getPool = async (
  poolId: string,
  blockNumber?: number
): Promise<any> => {
  const data = `
    id
    address
    poolType
    swapFee
    totalShares
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
    "https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2",
    query,
    { poolId, blockNumber }
  );

  if (result && result.pools && result.pools.length) {
    return result.pools[0];
  }
  return null;
};
