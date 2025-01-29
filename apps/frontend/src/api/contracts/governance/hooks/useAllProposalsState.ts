import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { abi } from "thor-devkit"
import { getProposalStateQueryKey, ProposalState } from "./useProposalState"

const b3trGovernorInterface = B3TRGovernor__factory.createInterface()
const proposalStateFragment = b3trGovernorInterface.getFunction("state").format("json")
const proposalStateABi = new abi.Function(JSON.parse(proposalStateFragment))

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const getAllProposalsStateClauses = (proposalIds: string[]) => {
  const clauses: Connex.VM.Clause[] = proposalIds.map(proposalId => {
    return {
      to: GOVERNANCE_CONTRACT,
      value: 0,
      data: proposalStateABi.encode(proposalId),
    }
  })

  return clauses
}

export const getAllProposalsStateQueryKey = () => ["PROPOSALS", "ALL", "STATE"]

export const useAllProposalsState = (proposalsIds: string[]) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getAllProposalsStateQueryKey(),
    queryFn: async () => {
      const clauses = getAllProposalsStateClauses(proposalsIds)
      const res = await thor.explain(clauses).execute()

      const states = res.map((r, index) => {
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.revertReason}`)
        const decoded = proposalStateABi.decode(r.data)
        const proposalId = proposalsIds[index] as string
        const state = Number(decoded[0]) as ProposalState

        queryClient.setQueryData(getProposalStateQueryKey(proposalId), state)
        return {
          proposalId,
          state,
        }
      })
      return states
    },
    enabled: !!proposalsIds.length && !!thor,
  })
}
