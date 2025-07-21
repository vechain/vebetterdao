import { useQuery, useQueryClient } from "@tanstack/react-query"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getProposalStateQueryKey } from "./useProposalState"

const abi = B3TRGovernor__factory.abi
const functionName = "state" as const
const address = getConfig().b3trGovernorAddress as `0x${string}`

export const getAllProposalsStateQueryKey = (proposalsIds?: string[]) =>
  proposalsIds ? ["PROPOSALS", "ALL", "STATE", proposalsIds] : ["PROPOSALS", "ALL", "STATE"]

export const useAllProposalsState = (proposalsIds: string[]) => {
  const thor = useThor()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getAllProposalsStateQueryKey(proposalsIds),
    queryFn: async () => {
      const res = await executeMultipleClausesCall({
        thor,
        calls: proposalsIds.map(
          proposalId =>
            ({
              abi,
              functionName,
              address,
              args: [proposalId],
            }) as const,
        ),
      })

      return res.map((state, index) => {
        const proposalId = proposalsIds[index] as string
        queryClient.setQueryData(getProposalStateQueryKey(proposalId), [state])
        return { proposalId, state }
      })
    },
    enabled: !!proposalsIds.length && !!thor,
  })
}
