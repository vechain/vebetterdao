import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useThor, executeMultipleClausesCall } from "@vechain/vechain-kit"

import { ProposalState } from "@/hooks/proposals/grants/types"
import { useEvents } from "@/hooks/useEvents"

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi

export const getProposalClaimableUserDepositsQueryKey = (userAddress: string) => ["allClaimableDeposits", userAddress]

/**
 * Fetches claimable VOT3 deposits for a user across all proposals.
 *
 * Approach:
 * 1. Fetch ProposalDeposit events filtered by depositor (indexed param) — only this user's deposits
 * 2. Get unique proposal IDs from those events
 * 3. Batch call getUserDeposit for each — filter to deposits > 0 (not yet withdrawn)
 * 4. Batch call state for remaining proposals — filter out Pending (can't withdraw yet)
 */
export const useProposalClaimableUserDeposits = (userAddress: string) => {
  const thor = useThor()

  // Step 1: Fetch only this user's deposit events (depositor is indexed)
  const { data: depositEvents, isLoading: eventsLoading } = useEvents({
    abi,
    contractAddress: GOVERNOR_CONTRACT,
    eventName: "ProposalDeposit",
    filterParams: { depositor: userAddress as `0x${string}` },
    select: events => {
      // Step 2: Extract unique proposal IDs
      const ids = new Set<string>()
      for (const event of events) {
        ids.add(event.decodedData.args.proposalId.toString())
      }
      return [...ids]
    },
    enabled: !!userAddress,
  })

  const proposalIds = depositEvents ?? []

  // Steps 3 & 4: Batch check deposits and states
  return useQuery({
    queryKey: getProposalClaimableUserDepositsQueryKey(userAddress),
    enabled: !!thor && !!userAddress && !eventsLoading && proposalIds.length > 0,
    queryFn: async () => {
      // Step 3: Batch getUserDeposit for all proposals
      const deposits = await executeMultipleClausesCall({
        thor,
        calls: proposalIds.map(
          proposalId =>
            ({
              abi,
              address: GOVERNOR_CONTRACT,
              functionName: "getUserDeposit",
              args: [BigInt(proposalId), userAddress],
            }) as const,
        ),
      })

      // Filter to proposals with active deposits (not yet withdrawn)
      const activeDeposits = proposalIds
        .map((proposalId, index) => ({
          proposalId,
          deposit: (deposits[index] as bigint).toString(),
        }))
        .filter(({ deposit }) => deposit !== "0")

      if (activeDeposits.length === 0) {
        return { claimableDeposits: [], totalClaimableDeposits: BigInt(0) }
      }

      // Step 4: Batch check proposal states for those with active deposits
      const states = await executeMultipleClausesCall({
        thor,
        calls: activeDeposits.map(
          ({ proposalId }) =>
            ({
              abi,
              address: GOVERNOR_CONTRACT,
              functionName: "state",
              args: [BigInt(proposalId)],
            }) as const,
        ),
      })

      // Withdrawable = all states except Pending
      const claimableDeposits = activeDeposits.filter((_, index) => {
        const state = states[index] as number
        return state !== ProposalState.Pending
      })

      return {
        claimableDeposits,
        totalClaimableDeposits: claimableDeposits.reduce((acc, { deposit }) => acc + BigInt(deposit), BigInt(0)),
      }
    },
  })
}
