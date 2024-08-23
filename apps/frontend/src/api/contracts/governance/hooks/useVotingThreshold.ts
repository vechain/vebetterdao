import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { ethers } from "ethers"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress
const governorInterface = B3TRGovernor__factory.createInterface()

/**
 * Returns the query key for fetching the voting threshold from the governor contract.
 * @returns The query key for fetching the voting threshold.
 */
export const getVotingThresholdQueryKey = () => {
  getCallKey({ method: "votingThreshold", keyArgs: [] })
}

/**
 * Get the voting threhsold (i.e the minimum number of votes required for casting a vote) in the governor contract
 * @returns the voting threshold
 */
export const useVotingThreshold = () => {
  return useCall({
    contractInterface: governorInterface,
    contractAddress: GOVERNANCE_CONTRACT,
    method: "votingThreshold",
    args: [],
    mapResponse: res => ethers.formatEther(res.decoded[0]),
  })
}
