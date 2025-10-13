import { getConfig } from "@repo/config"
import { B3TR__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause } from "@vechain/vechain-kit"

const abi = B3TR__factory.abi
const address = getConfig().b3trContractAddress
const method = "paused" as const
/**
 * getIsB3trPausedQueryKey is a function that returns the query key for the getIsB3trPaused query.
 *
 * @returns {string[]} An array of strings representing the query key.
 */
export const getIsB3trPausedQueryKey = () => ["b3tr", "paused"]
/**
 * useB3trPaused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the B3tr contract.
 *
 * @returns {UseQueryResult} The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useB3trPaused = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0],
    },
  })
}
