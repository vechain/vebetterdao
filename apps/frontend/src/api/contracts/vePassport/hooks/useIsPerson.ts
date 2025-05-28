import { useCallClause, getCallClauseQueryKey, useWallet } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "isPerson" as const

/**
 * Returns the query key for fetching the isPerson status.
 * @param user - The user address.
 * @returns The query key for fetching the isPerson status.
 */
export const getIsPersonQueryKey = (user: string) => {
  return getCallClauseQueryKey<typeof abi>({ address, method: "isPerson", args: [user] })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract.
 * @param user - The user address.
 * @returns The isPerson status.
 */
export const useIsPerson = (user?: string | null) => {
  const { data } = useCallClause({
    abi,
    address,
    method,
    args: [user || ""],
    queryOptions: {
      enabled: !!user,
    },
  })
  return data?.[0]
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract for the current user.
 * @returns The isPerson status.
 */
export const useIsUserPerson = () => {
  const { account } = useWallet()
  return useIsPerson(account?.address)
}
