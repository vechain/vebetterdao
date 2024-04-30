import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const governorInterface = B3TRGovernor__factory.createInterface()
/**
 * Get the current proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @param thor  the thor client
 * @returns  the current proposal threshold
 */
export const getProposalThreshold = async (thor: Connex.Thor) => {
  const functionFragment = governorInterface.getFunction("depositThreshold").format("json")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getProposalThresholdQueryKey = () => ["depositThreshold"]
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
