import { useWallet, useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/typechain-types"

const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const abi = VeBetterPassport__factory.abi
const method = "getPassportForEntity" as const

/**
 * Returns the query key for fetching the passport for an entity.
 * @param entity - The entity address.
 * @returns The query key for fetching the passport for an entity.
 */
export const getPassportForEntityQueryKey = (entity?: string | null) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [entity as `0x${string}`] })
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
    args: [(entity ?? "0x") as `0x${string}`],
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
