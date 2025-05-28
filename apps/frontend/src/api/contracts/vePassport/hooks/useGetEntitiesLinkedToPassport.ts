import { useWallet, useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getEntitiesLinkedToPassport" as const

/**
 * Returns the query key for fetching entities linked to a passport.
 * @param passport - The passport address.
 * @returns The query key for fetching entities linked to a passport.
 */
export const getEntitiesLinkedToPassportQueryKey = (passport?: string | null) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [passport ?? "0x"] })
}

/**
 * Hook to get the entities linked to a passport from the VeBetterPassport contract.
 * @param passport - The passport address.
 * @returns An array of entity addresses linked to the given passport.
 */
export const useGetEntitiesLinkedToPassport = (passport?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [passport ?? "0x"],
    queryOptions: {
      select: data => data[0],
      enabled: !!passport,
    },
  })
}

/**
 * Hook to get the entities linked to the current user's passport from the VeBetterPassport contract.
 * @returns An array of entity addresses linked to the current user's passport.
 */
export const useGetUserEntitiesLinkedToPassport = () => {
  const { account } = useWallet()
  return useGetEntitiesLinkedToPassport(account?.address)
}
