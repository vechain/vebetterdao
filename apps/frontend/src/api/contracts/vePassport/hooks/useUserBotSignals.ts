import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "signaledCounter"

/**
 * Returns the query key for fetching the user bot signals.
 * @param address - The user address.
 * @returns The query key for fetching the user bot signals.
 */
export const getUserBotSignalsQueryKey = (address?: string) => {
  return getCallKey({ method, keyArgs: [address] })
}

/**
 * Hook to get the user bot signals from the VeBetterPassport contract.
 * @param address - The user address.
 * @returns The user bot signals.
 */
export const useUserBotSignals = (address?: string) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [address],
  })
}
