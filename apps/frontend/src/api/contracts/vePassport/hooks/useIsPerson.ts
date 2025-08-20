import { useCallClause, getCallClauseQueryKeyWithArgs, useWallet } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "isPerson" as const

/**
 * Returns the query key for fetching the isPerson status.
 * @param user - The user address.
 * @returns The query key for fetching the isPerson status.
 */
export const getIsPersonQueryKey = (user: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [user as `0x${string}`] })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract.
 * @param user - The user address.
 * @returns The isPerson status.
 */
export const useIsPerson = (user?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(user ?? "0x") as `0x${string}`],
    queryOptions: {
      enabled: !!user,
      select: data => data[0],
    },
  })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract for the current user.
 * @returns The isPerson status.
 */
export const useIsUserPerson = () => {
  const { account } = useWallet()
  return useIsPerson(account?.address)
}
