import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { useGetVotesOnBlock } from "./useVotesOnBlock"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress
const method = "getDepositVotingPower" as const
export const getDepositsVotesOnBlockQueryKey = (userAddress: string, blockNumber: number) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [userAddress as `0x${string}`, BigInt(blockNumber)],
  })
/**
 *  Hook to get the total number of deposits votes of the given address (with decimals removed)
 * @returns the number of deposits votes of the given address (with decimals removed)
 */
export const useTotalVotesOnBlock = (block?: number, address?: string, enabled = true) => {
  const { data: votes } = useGetVotesOnBlock(block, address, enabled)
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [(address ?? "") as `0x${string}`, BigInt(block ?? 0)],
    queryOptions: {
      enabled: !!address && !!block && enabled,
      select: data => {
        const depositsVotesWei = data[0]
        const depositsVotes = ethers.formatEther(depositsVotesWei)
        // Use bigint arithmetic to preserve full precision (parseFloat loses precision for large numbers)
        const votesWei = votes ? ethers.parseEther(votes) : 0n
        const totalVotesWithDepositsWei = votesWei + depositsVotesWei
        const totalVotesWithDeposits = ethers.formatEther(totalVotesWithDepositsWei)
        return {
          totalVotesWithDeposits,
          totalVotesWithDepositsWei,
          depositsVotes,
          depositsVotesWei,
        }
      },
    },
  })
}
