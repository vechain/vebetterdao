import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"

const address = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "participatedInGovernance" as const

/**
 * Returns the query key for fetching participated in governance status.
 * @param userAddress The user address to check governance participation
 * @returns The query key for fetching participated in governance status.
 */
export const getParticipatedInGovernanceQueryKey = (userAddress: string | null) =>
  getCallClauseQueryKey<typeof abi>({ address, method, args: [userAddress || ""] })

/**
 * Hook to get whether an address has participated in governance
 * @param userAddress The address to know if they have participated in governance
 * @returns whether the address has participated in governance
 */
export const useParticipatedInGovernance = (userAddress: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [userAddress || ""],
    queryOptions: {
      enabled: !!userAddress,
      select: data => Boolean(data[0]),
    },
  })
}
