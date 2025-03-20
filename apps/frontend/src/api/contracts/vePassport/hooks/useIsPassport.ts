import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/vechain-kit"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "isPassport"

/**
 * Returns the query key for checking if an address is a passport.
 * @param address - The address to check.
 * @returns The query key for checking if an address is a passport.
 */
export const getIsPassportQueryKey = (address?: string | null) => {
  return getCallKey({ method, keyArgs: [address] })
}

/**
 * Hook to check if an address is a passport using the VeBetterPassport contract.
 * @param address - The address to check.
 * @returns A boolean indicating whether the address is a passport.
 */
export const useIsPassport = (address?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [address],
    enabled: !!address,
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
