import { useWallet, useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const contractAddress = getConfig().veBetterPassportContractAddress
const abi = VeBetterPassport__factory.abi
const method = "isPassport" as const

/**
 * Returns the query key for checking if an address is a passport.
 * @param address - The address to check.
 * @returns The query key for checking if an address is a passport.
 */
export const getIsPassportQueryKey = (address?: string | null) => {
  return getCallClauseQueryKey<typeof abi>({
    address: contractAddress,
    method,
    args: [(address ?? "0x") as `0x${string}`],
  })
}

/**
 * Hook to check if an address is a passport using the VeBetterPassport contract.
 * @param address - The address to check.
 * @returns A boolean indicating whether the address is a passport.
 */
export const useIsPassport = (address?: string | null) => {
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

/**
 * Hook to check if the current user's address is a passport using the VeBetterPassport contract.
 * @returns A boolean indicating whether the current user's address is a passport.
 */
export const useIsUserPassport = () => {
  const { account } = useWallet()
  return useIsPassport(account?.address)
}
