import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "isEntity"

/**
 * Returns the query key for checking if an address is an entity.
 * @param address - The address to check.
 * @returns The query key for checking if an address is an entity.
 */
export const getIsEntityQueryKey = (address?: string | null) => {
  return getCallKey({ method, keyArgs: [address] })
}

/**
 * Hook to check if an address is an entity using the VeBetterPassport contract.
 * @param address - The address to check.
 * @returns A boolean indicating whether the address is an entity.
 */
export const useIsEntity = (address?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [address],
    enabled: !!address,
  })
}

/**
 * Hook to check if the current user's address is an entity using the VeBetterPassport contract.
 * @returns A boolean indicating whether the current user's address is an entity.
 */
export const useIsUserEntity = () => {
  const { account } = useWallet()
  return useIsEntity(account)
}
