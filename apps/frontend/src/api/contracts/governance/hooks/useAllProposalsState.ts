import { useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query"
import { executeMultipleClausesCall, useThor, type MultipleClausesCallParameters } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory, GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { getProposalStateQueryKey } from "./useProposalState"
import { getGrantProposalStateQueryKey } from "./useGrantProposalState"
import { useMemo } from "react"
import { ProposalState } from "@/hooks/proposals/grants/types"

export const getAllProposalsStateQueryKey = () => ["PROPOSALS", "ALL", "STATE"]

export const useAllProposalsState = ({
  grantProposalsIds,
  standardProposalsIds,
}: {
  grantProposalsIds: string[]
  standardProposalsIds: string[]
}): UseQueryResult<{
  grantsProposalStates: { proposalId: string; state: ProposalState }[]
  standardProposalStates: { proposalId: string; state: ProposalState }[]
}> => {
  const thor = useThor()
  const queryClient = useQueryClient()
  const grantsManagerContractAddress = getConfig().grantsManagerContractAddress as `0x${string}`
  const b3trGovernorAddress = getConfig().b3trGovernorAddress as `0x${string}`

  const grantProposalsCalls = useMemo(() => {
    return grantProposalsIds.map(proposalId => ({
      abi: GrantsManager__factory.abi,
      functionName: "grantState" as const,
      address: grantsManagerContractAddress,
      args: [proposalId] as const,
    }))
  }, [grantProposalsIds, grantsManagerContractAddress])

  const standardProposalsCalls = useMemo(() => {
    return standardProposalsIds.map(proposalId => ({
      abi: B3TRGovernor__factory.abi,
      functionName: "state" as const,
      address: b3trGovernorAddress,
      args: [proposalId] as const,
    }))
  }, [b3trGovernorAddress, standardProposalsIds])

  return useQuery({
    queryKey: getAllProposalsStateQueryKey(),
    queryFn: async () => {
      const calls: MultipleClausesCallParameters = [...grantProposalsCalls, ...standardProposalsCalls]

      const res = await executeMultipleClausesCall({
        thor,
        calls,
      })

      // Combine the proposal IDs in the same order as the calls
      const proposalsIds = [...grantProposalsIds, ...standardProposalsIds]

      return {
        grantsProposalStates: (res as number[]).slice(0, grantProposalsIds.length).map((state, index) => {
          const proposalId = proposalsIds[index] as string
          // Cache grant proposal state using the proper grant query key
          queryClient.setQueryData(getGrantProposalStateQueryKey(proposalId), [state])
          return { proposalId, state: state as ProposalState }
        }),
        standardProposalStates: (res as number[]).slice(grantProposalsIds.length).map((state, index) => {
          const proposalId = proposalsIds[index + grantProposalsIds.length] as string
          queryClient.setQueryData(getProposalStateQueryKey(proposalId), [state])
          return { proposalId, state: state as ProposalState }
        }),
      }
    },
    enabled: (!!grantProposalsIds.length || !!standardProposalsIds.length) && !!thor,
  })
}
