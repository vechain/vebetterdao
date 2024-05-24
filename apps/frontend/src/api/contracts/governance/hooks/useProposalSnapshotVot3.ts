import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress
const governorInterface = B3TRGovernor__factory.createInterface()

export const getProposalSnapshotVot3QueryKey = (roundId: number) => {
  getCallKey({ method: "getVotes", keyArgs: [roundId] })
}

/**
 * Retrieves the votes for a specific round of a proposal snapshot.
 * @param roundId - The ID of the round.
 * @returns The votes for the specified round.
 */
export const useProposalSnapshotVot3 = (roundId?: number, enabled = true) => {
  const { account } = useWallet()
  return useCall({
    contractInterface: governorInterface,
    contractAddress: GOVERNANCE_CONTRACT,
    method: "getVotes",
    args: [account, roundId],
    enabled: !!roundId && enabled,
  })
}
