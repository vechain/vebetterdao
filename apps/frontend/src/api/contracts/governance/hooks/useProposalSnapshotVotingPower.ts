import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress
const governorInterface = B3TRGovernor__factory.createInterface()

/**
 * Returns the query key for fetching the snapshot voting power of a proposal round.
 * @param roundId - The ID of the proposal round.
 * @returns The query key for fetching the snapshot voting power.
 */
export const getProposalSnapshotVotingPowerQueryKey = (roundId: number) => {
  getCallKey({ method: "getQuadraticVotingPower", keyArgs: [roundId] })
}

/**
 * Custom hook for fetching the snapshot voting power of a proposal round.
 * @param roundId - The ID of the proposal round.
 * @returns The snapshot voting power of the proposal round.
 */
export const useProposalSnapshotVotingPower = (roundId?: number, enabled = true) => {
  const { account } = useWallet()
  return useCall({
    contractInterface: governorInterface,
    contractAddress: GOVERNANCE_CONTRACT,
    method: "getQuadraticVotingPower",
    args: [account, roundId],
    enabled: !!roundId && !!account && enabled,
  })
}
