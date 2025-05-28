import { useWallet, useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "getPassportForEntity" as const

/**
 * Returns the query key for fetching the passport for an entity.
 * @param entity - The entity address.
 * @returns The query key for fetching the passport for an entity.
 */
export const getPassportForEntityQueryKey = (entity?: string | null) => {
  return getCallClauseQueryKey<typeof abi>({ address, method, args: [entity ?? "0x"] })
}

/**
 * Hook to get the passport for an entity from the VeBetterPassport contract.
 * @param entity - The entity address.
 * @returns The passport address for the given entity.
 */
export const useGetPassportForEntity = (entity?: string | null) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [entity ?? "0x"],
    queryOptions: {
      enabled: !!entity,
      select: data => data[0],
    },
  })
}

/**
 * Hook to get the passport for the current user's entity from the VeBetterPassport contract.
 * @returns The passport address for the current user's entity.
 */
export const useGetUserPassportForEntity = () => {
  const { account } = useWallet()
  return useGetPassportForEntity(account?.address)
}
