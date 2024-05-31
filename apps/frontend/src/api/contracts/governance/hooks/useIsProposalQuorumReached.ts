import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
const b3trGovernorAbi = B3TRGovernorJson.abi
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

export const getIsProposalQuorumReached = async (thor: Connex.Thor, proposalId: string): Promise<boolean> => {
  if (!proposalId) return Promise.reject(new Error("proposalId is required"))
  const quorumAbi = b3trGovernorAbi.find(abi => abi.name === "quorumReached")
  if (!quorumAbi) throw new Error("quorumReached function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(quorumAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getIsProposalQuorumReachedQueryKey = (proposalId: string) => ["quorumReached", proposalId]

export const useIsProposalQuorumReached = (proposalId: string, enabled: boolean = false) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsProposalQuorumReachedQueryKey(proposalId),
    queryFn: async () => await getIsProposalQuorumReached(thor, proposalId),
    enabled: !!thor && !!proposalId && enabled,
  })
}
