import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useWallet, useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "getQuadraticVotingPower" as const
/**
 * Returns the query key for fetching the snapshot user quadratic voting power of a proposal round.
 * @param roundId - The ID of the proposal round.
 * @returns The query key for fetching the snapshot user quadratic voting power.
 */
export const getProposalSnapshotUserQuadraticVotingPowerQueryKey = (userAddress: string, roundId: number) => {
  return getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [(userAddress ?? "0x") as `0x${string}`, BigInt(roundId ?? 0)],
  })
}
/**
 * Custom hook for fetching the snapshot user quadratic voting power of a proposal round.
 * @param roundId - The ID of the proposal round.
 * @returns The snapshot user quadratic voting power of the proposal round.
 */
export const useProposalSnapshotUserQuadraticVotingPower = (roundId?: number, enabled = true) => {
  const { account } = useWallet()
  return useCallClause({
    abi,
    address,
    method,
    args: [(account?.address ?? "0x") as `0x${string}`, BigInt(roundId ?? 0)],
    queryOptions: {
      enabled: !!roundId && !!account?.address && enabled,
      select: data => data[0],
    },
  })
}
