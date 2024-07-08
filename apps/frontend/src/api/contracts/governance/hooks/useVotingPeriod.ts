import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { ethers } from "ethers"
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const governorInterface = B3TRGovernor__factory.createInterface()
/**
 * Get the votingPeriod i.e voting duration from the governor contract (in blocks)
 * @param thor  the thor client
 * @returns  the current voting period
 */
export const getVotingPeriod = async (thor: Connex.Thor): Promise<string> => {
  const functionFragment = governorInterface.getFunction("votingPeriod").format("json")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getVotingPeriodQueryKey = () => ["VOTING_PERIOD"]
/**
 *  Hook to get the voting period from the governor contract (i.e the number of blocks for the voting period)
 * @returns the voting period
 */
export const useVotingPeriod = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVotingPeriodQueryKey(),
    queryFn: async () => await getVotingPeriod(thor),
    enabled: !!thor,
  })
}
