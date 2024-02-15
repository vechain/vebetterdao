import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress
import { B3TRGovernorJson } from "@repo/contracts"
const b3trGovernorAbi = B3TRGovernorJson.abi

/**
 * Get the current proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @param thor  the thor client
 * @returns  the current proposal threshold
 */
export const getProposalThreshold = async (thor: Connex.Thor) => {
  const proposalThresholdAbi = b3trGovernorAbi.find(abi => abi.name === "proposalThreshold")
  if (!proposalThresholdAbi) throw new Error("proposalThreshold function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(proposalThresholdAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getProposalThresholdQueryKey = () => ["proposalThreshold"]
/**
 *  Hook to get the proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @returns
 */
export const useProposalThreshold = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalThresholdQueryKey(),
    queryFn: async () => await getProposalThreshold(thor),
    enabled: !!thor,
  })
}
