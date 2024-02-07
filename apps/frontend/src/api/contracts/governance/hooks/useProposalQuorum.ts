import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import GovernorContract from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
const governorContractAbi = GovernorContract.abi
const GOVERNANCE_CONTRACT = getConfig().governorContractAddress

/**
 * Get the quorum at a given block number
 * @param thor  the thor client
 * @param blockNumber the block number to check (proposal.voteStart)
 * @returns the quorum at the given block number
 */
export const getProposalQuorum = async (
  thor: Connex.Thor,
  blockNumber: string,
): Promise<{
  original: string
  scaled: string
  formatted: string
}> => {
  const quorumAbi = governorContractAbi.find(abi => abi.name === "quorum")
  if (!quorumAbi) throw new Error("quorum function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(quorumAbi).call(blockNumber)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const original = res.decoded[0]
  const scaled = FormattingUtils.scaleNumberDown(original, 18)
  const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)

  return {
    original,
    scaled,
    formatted,
  }
}

export const getProposalQuorumQueryKey = (blockNumber: string) => ["proposalQuorum", blockNumber]
/**
 *  Hook to get the quorum at a given block number
 * @param blockNumber  the block number to check (proposal.voteStart)
 * @returns  the quorum at the given block number
 */
export const useProposalQuorum = (blockNumber: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalQuorumQueryKey(blockNumber),
    queryFn: async () => await getProposalQuorum(thor, blockNumber),
    enabled: !!thor,
  })
}
