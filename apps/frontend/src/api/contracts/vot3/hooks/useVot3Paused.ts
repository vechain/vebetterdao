import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

import { getConfig } from "@repo/config"
import { VOT3__factory } from "@vechain-kit/vebetterdao-contracts"

const abi = VOT3__factory.abi
const address = getConfig().vot3ContractAddress
const method = "paused" as const

export const getIsVot3PausedQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * useVot3Paused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the Vot3 contract.
 *
 * @returns {UseQueryResult} The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useVot3Paused = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => Boolean(data[0]),
    },
  })
}
