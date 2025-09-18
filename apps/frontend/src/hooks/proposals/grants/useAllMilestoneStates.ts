import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { GrantProposalEnriched, MilestoneState } from "./types"

const address = getConfig().grantsManagerContractAddress
const abi = GrantsManager__factory.abi
const method = "milestoneState" as const

/**
 * Query key for all milestone states of a proposal
 */
export const getAllMilestoneStatesQueryKey = (proposalId?: string) => ["all-milestone-states", proposalId]

/**
 * Hook to get all milestone states for a proposal using executeMultipleClausesCall
 * This efficiently fetches all milestone states in a single batch call
 */
export const useAllMilestoneStates = (proposal?: GrantProposalEnriched) => {
  const thor = useThor()
  const milestones = useMemo(() => proposal?.milestones ?? [], [proposal?.milestones])
  const hasValidData = !!proposal?.id && milestones.length > 0

  return useQuery({
    queryKey: getAllMilestoneStatesQueryKey(proposal?.id),
    queryFn: async () => {
      if (!thor || !proposal?.id || milestones.length === 0) {
        return []
      }

      try {
        const calls = milestones.map(
          (_, index) =>
            ({
              abi,
              functionName: method,
              address: address as `0x${string}`,
              args: [BigInt(proposal.id), BigInt(index)],
            }) as const,
        )

        const results = await executeMultipleClausesCall({
          thor,
          calls,
        })

        return results.map((state, index) => ({
          state: (state as number) ?? MilestoneState.Pending,
          milestone: milestones[index],
          index,
        }))
      } catch (error) {
        console.error("Error fetching milestone states:", error)
        // Return default pending states for all milestones on error
        return milestones.map((milestone, index) => ({
          state: MilestoneState.Pending,
          milestone,
          index,
        }))
      }
    },
    enabled: hasValidData && !!thor,
  })
}
