import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { ProposalState } from "@/api"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const functionName = "state" as const

/**
 * Returns the query key for fetching multiple grant proposal states.
 * @param proposalIds Array of proposal IDs to get states for
 * @returns The query key for fetching multiple proposal states
 */
export const getGrantProposalStatesQueryKey = (proposalIds: string[]) => [
  "grantProposalStates",
  proposalIds.sort().join(","),
]

/**
 * Hook to get multiple grant proposal states from the governor contract in batch
 * @param proposalIds Array of proposal IDs to get states for
 * @returns Object with states mapped by proposal ID and loading state
 */
export const useGrantProposalStates = (proposalIds: string[]) => {
  const thor = useThor()

  return useQuery({
    queryKey: getGrantProposalStatesQueryKey(proposalIds),
    queryFn: async () => {
      if (proposalIds.length === 0) {
        return {}
      }

      const states = await executeMultipleClausesCall({
        thor,
        calls: proposalIds.map(proposalId => ({
          abi,
          address,
          functionName,
          args: [BigInt(proposalId)],
        })),
      })

      // Create a map of proposalId -> state for easy lookup
      const statesMap: Record<string, ProposalState> = {}
      proposalIds.forEach((proposalId, index) => {
        statesMap[proposalId] = states[index] as ProposalState
      })

      return statesMap
    },
    enabled: proposalIds.length > 0 && !!thor,
  })
}
