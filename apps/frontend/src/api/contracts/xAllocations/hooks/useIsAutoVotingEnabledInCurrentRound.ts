import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs, useWallet } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVoting__factory.abi
const method = "isUserAutoVotingEnabledInCurrentRound" as const

/**
 * Returns the query key for checking if auto-voting is enabled for a user in the current round.
 * @param userAddress The address of the user to check
 * @returns The query key for checking if auto-voting is enabled in current round.
 */
export const getIsAutoVotingEnabledInCurrentRoundQueryKey = (userAddress: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [userAddress as `0x${string}`],
  })

/**
 * Hook to check if auto-voting is enabled for the current authenticated user in the current round.
 * This is a snapshot taken at the start of the round - it determines if the relayer
 * will vote for this user in the current round.
 *
 * Note: This is different from `useIsAutoVotingEnabled` which checks the current status.
 * A user could have disabled auto-voting mid-round, but this will still return true
 * if they were enabled at the round start.
 *
 * @returns boolean indicating if auto-voting is enabled for the current round
 */
export const useIsAutoVotingEnabledInCurrentRound = () => {
  const { account } = useWallet()

  return useCallClause({
    abi,
    address,
    method,
    args: [(account?.address || "") as `0x${string}`],
    queryOptions: {
      enabled: !!account?.address,
      select: data => data[0],
    },
  })
}
