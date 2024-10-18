import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "isBlacklisted"

/**
 * Returns the query key for fetching the IsBlacklisted status.
 * @returns The query key for fetching the IsBlacklisted status.
 */
export const getIsBlacklistedQueryKey = (address?: string) => {
  return getCallKey({ method, keyArgs: [address] })
}

/**
 * Hook to get the IsBlacklisted status from the VeBetterPassport contract.
 * @param address - The user address.
 * @returns The IsBlacklisted status.
 */
export const useIsBlacklisted = (address?: string) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [address ?? ""],
    enabled: !!address,
  })
}
