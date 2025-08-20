import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain-kit/vebetterdao-contracts"
import { formatEther } from "viem"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "quorum" as const

/**
 * Returns the query key for fetching the proposal quorum.
 * @param blockNumber The block number to check (proposal.voteStart)
 * @returns The query key for fetching the proposal quorum.
 */
export const getProposalQuorumQueryKey = (blockNumber?: string | number) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(blockNumber || 0)] })

/**
 * Hook to get the quorum at a given block number (with decimals removed)
 * @param blockNumber The block number to check (proposal.voteStart)
 * @param enabled Whether the query is enabled
 * @returns the quorum at the given block number (with decimals removed)
 */
export const useProposalQuorum = (blockNumber?: string | number, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(blockNumber || 0)],
    queryOptions: {
      enabled: !!blockNumber && enabled,
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
