import { useWallet, useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const contractAddress = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "isEntity" as const

/**
 * Returns the query key for checking if an address is an entity.
 * @param address - The address to check.
 * @returns The query key for checking if an address is an entity.
 */
export const getIsEntityQueryKey = (address?: string | null) => {
  return getCallClauseQueryKey<typeof abi>({ address: contractAddress, method, args: [address ?? "0x"] })
}

/**
 * Hook to check if an address is an entity using the VeBetterPassport contract.
 * @param address - The address to check.
 * @returns A boolean indicating whether the address is an entity.
 */
export const useIsEntity = (address?: string | null) => {
  return useCallClause({
    abi,
    address: contractAddress,
    method,
    args: [address ?? "0x"],
    queryOptions: {
      enabled: !!address,
      select: data => data[0],
    },
  })
}

/**
 * Hook to check if the current user's address is an entity using the VeBetterPassport contract.
 * @returns A boolean indicating whether the current user's address is an entity.
 */
export const useIsUserEntity = () => {
  const { account } = useWallet()
  return useIsEntity(account?.address)
}
