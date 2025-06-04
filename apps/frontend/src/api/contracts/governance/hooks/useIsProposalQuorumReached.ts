import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

export const getIsProposalQuorumReached = async (thor: ThorClient, proposalId: string): Promise<boolean> => {
  if (!proposalId) return Promise.reject(new Error("proposalId is required"))

  const res = await thor.contracts.load(GOVERNANCE_CONTRACT, B3TRGovernor__factory.abi).read.quorumReached(proposalId)

  if (!res) return Promise.reject(new Error("Quorum reached call failed"))

  return res[0] as boolean
}

export const getIsProposalQuorumReachedQueryKey = (proposalId: string) => ["quorumReached", proposalId]

export const useIsProposalQuorumReached = (proposalId: string, enabled: boolean = false) => {
  const thor = useThor()

  return useQuery({
    queryKey: getIsProposalQuorumReachedQueryKey(proposalId),
    queryFn: async () => await getIsProposalQuorumReached(thor, proposalId),
    enabled: !!thor && !!proposalId && enabled,
  })
}
