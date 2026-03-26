import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress
const method = "getUserDeposit" as const
export const getProposalUserDepositQueryKey = (proposalId: string, userAddress: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId), userAddress as `0x${string}`],
  })
export const useProposalUserDeposit = (proposalId: string, userAddress: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId), userAddress as `0x${string}`],
    queryOptions: {
      enabled: !!proposalId && !!userAddress,
      select: data => data[0],
    },
  })
}
