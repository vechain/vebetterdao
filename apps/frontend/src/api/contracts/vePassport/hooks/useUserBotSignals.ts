import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"

const contractAddress = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "signaledCounter" as const

/**
 * Returns the query key for fetching the user bot signals.
 * @param address - The user address.
 * @returns The query key for fetching the user bot signals.
 */
export const getUserBotSignalsQueryKey = (address?: string) => {
  return getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [address as `0x${string}`],
  })
}

/**
 * Hook to get the user bot signals from the VeBetterPassport contract.
 * @param address - The user address.
 * @returns The user bot signals.
 */
export const useUserBotSignals = (address?: string) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [(address ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!address,
      select: data => data[0],
    },
  })
}
