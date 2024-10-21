import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "isWhitelisted"

/**
 * Returns the query key for fetching the isWhitelisted status.
 * @returns The query key for fetching the isWhitelisted status.
 */
export const getIsWhitelistedQueryKey = (address?: string) => {
  return getCallKey({ method, keyArgs: [address] })
}

/**
 * Hook to get the isWhitelisted status from the VeBetterPassport contract.
 * @param address - The user address.
 * @returns The isWhitelisted status.
 */
export const useIsWhitelisted = (address?: string) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [address ?? ""],
    enabled: !!address,
  })
}
