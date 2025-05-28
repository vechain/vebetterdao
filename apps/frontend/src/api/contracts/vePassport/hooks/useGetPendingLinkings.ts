import { useWallet, useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getPendingLinkings" as const

/**
 * Returns the query key for fetching pending linkings.
 * @param user - The user address.
 * @returns The query key for fetching pending linkings.
 */
export const getPendingLinkingsQueryKey = (user?: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [user ?? "0x"] })
}

/**
 * Hook to get pending linkings from the VeBetterPassport contract.
 * @param user - The user address.
 * @returns An object containing incoming and outgoing pending linkings for the user.
 */
export const useGetPendingLinkings = (user?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [user ?? "0x"],
    queryOptions: {
      enabled: !!user,
      select: data => ({
        incoming: data[0] ?? [],
        outgoing: data[1] ?? null,
      }),
    },
  })
}

/**
 * Hook to get pending linkings from the VeBetterPassport contract for the current user.
 * @returns An object containing incoming and outgoing pending linkings for the current user.
 */
export const useGetUserPendingLinkings = () => {
  const { account } = useWallet()
  return useGetPendingLinkings(account?.address)
}
