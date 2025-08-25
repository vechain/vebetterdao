import { useQuery, useQueryClient } from "@tanstack/react-query"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { getIsDepositReachedQueryKey } from "./useIsDepositReached"

const abi = B3TRGovernor__factory.abi
const functionName = "proposalDepositReached" as const
const address = getConfig().b3trGovernorAddress as `0x${string}`

export const getAllProposalsDepositReachedQueryKey = () => ["PROPOSALS", "ALL", "DEPOSIT_REACHED"]

export const useAllProposalsDepositReached = (proposalsIds: string[]) => {
  const thor = useThor()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getAllProposalsDepositReachedQueryKey(),
    queryFn: async () => {
      const depositsReachedResult = await executeMultipleClausesCall({
        thor,
        calls: proposalsIds.map(
          proposalId =>
            ({
              abi,
              functionName,
              address,
              args: [BigInt(proposalId)],
            }) as const,
        ),
      })

      const depositsReached = depositsReachedResult.map((depositReached, index) => {
        const proposalId = proposalsIds[index] as string
        queryClient.setQueryData(getIsDepositReachedQueryKey(proposalId), depositReached)
        return { proposalId, depositReached }
      })

      return depositsReached
    },
    enabled: !!thor && !!proposalsIds.length,
  })
}
