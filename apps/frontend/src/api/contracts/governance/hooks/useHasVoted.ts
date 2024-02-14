import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { GovernorContractJson } from "@repo/contracts"
const governorContractAbi = GovernorContractJson.abi
const GOVERNANCE_CONTRACT = getConfig().governorContractAddress

/**
 * Check if the given address has voted on the given proposal
 * @param thor  the thor client
 * @param proposalId the proposal id
 * @param address the address to check
 * @returns if the given address has voted on the given proposal
 */
export const getHasVoted = async (thor: Connex.Thor, proposalId: string, address?: string): Promise<boolean> => {
  if (!address) throw new Error("address is required")

  const getHasVotedAbi = governorContractAbi.find(abi => abi.name === "hasVoted")
  if (!getHasVotedAbi) throw new Error("hasVoted function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(getHasVotedAbi).call(proposalId, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getHasVotedQueryKey = (proposalId: string, address?: string) => ["hasVoted", proposalId, address]
/**
 * Hook to check if the given address has voted on the given proposal
 * @returns true if the given address has voted on the given proposal
 */
export const useHasVoted = (proposalId: string, address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getHasVotedQueryKey(proposalId, address),
    queryFn: async () => await getHasVoted(thor, proposalId, address),
    enabled: !!thor && !!address,
  })
}
