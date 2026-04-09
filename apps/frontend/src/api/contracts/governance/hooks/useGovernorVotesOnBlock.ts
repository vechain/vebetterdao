import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause } from "@vechain/vechain-kit"
import { ethers } from "ethers"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress
const method = "getVotes" as const

/**
 * B3TRGovernor.getVotes — does NOT include deposit voting power.
 * Use for governance proposal voting power checks.
 * For allocation voting (which includes deposits), use useGetVotesOnBlock.
 */
export const useGovernorVotesOnBlock = (block?: number, address?: string, enabled = true) => {
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
