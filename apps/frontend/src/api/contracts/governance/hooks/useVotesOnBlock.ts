import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { ethers } from "ethers"

// Uses XAllocationVoting.getVotes which includes deposit voting power
// for non-delegated users and returns delegated amount for delegated users.
const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress
const method = "getVotes" as const
export const getVotesOnBlockPrefixQueryKey = () => getCallClauseQueryKey({ abi, address: contractAddress, method })
export const getVotesOnBlockQueryKey = (userAddress: string, blockNumber: number) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [userAddress as `0x${string}`, BigInt(blockNumber)],
  })
/**
 *  Hook to get the number of votes of the given address (with deciamls removed)  - includes the delegated ones
 * @returns the number of votes of the given address (with deciamls removed)  - includes the delegated ones
 */
export const useGetVotesOnBlock = (block?: number, address?: string, enabled = true) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [(address ?? "") as `0x${string}`, BigInt(block ?? 0)],
    queryOptions: {
      enabled: !!address && !!block && enabled,
      select: data => ethers.formatEther(data[0]),
    },
  })
}
