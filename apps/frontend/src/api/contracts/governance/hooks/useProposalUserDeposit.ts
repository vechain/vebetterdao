import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress
const method = "getUserDeposit" as const

export const getProposalUserDepositQueryKey = (proposalId: string, userAddress: string) =>
  getCallClauseQueryKey<typeof abi>({
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
      select: data => data[0].$bigintString,
    },
  })
}
