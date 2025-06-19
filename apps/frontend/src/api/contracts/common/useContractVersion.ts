import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const abi = B3TRGovernor__factory.abi
const method = "version" as const

export const getVersionQueryKey = (contractAddress: string) =>
  getCallClauseQueryKey({ abi, address: contractAddress, method })

/**
 * Get the version of the contract
 * @returns The version of the contract
 */
export const useContractVersion = (contractAddress: string) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [],
    queryOptions: {
      select: data => data[0],
    },
  })
}
