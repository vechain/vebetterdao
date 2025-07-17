import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { formatEther } from "viem"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "depositThreshold" as const

/**
 * Returns the query key for fetching the deposit threshold from the governor contract.
 * @returns The query key for fetching the deposit threshold.
 */
export const getDepositThresholdQueryKey = () => getCallClauseQueryKey({ abi, address: address, method })

/**
 * Hook to get the proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @returns the current proposal threshold
 */
export const useDepositThreshold = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
