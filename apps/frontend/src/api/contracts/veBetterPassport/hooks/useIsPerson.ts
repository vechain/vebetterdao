import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractInterface = VeBetterPassport__factory.createInterface()
const contractAddress = getConfig().veBetterPassportContractAddress
const method = "isPerson"

export const getIsPersonQueryKey = (address: string) => {
  return getCallKey({ method: "vebetterpassport", keyArgs: ["isPerson", address] })
}

/**
 * Hook to get whether an address is a person according to the VeBetterPassport contract
 * @param address - the address to check
 * @returns true if the address is a person, false otherwise
 */
export const useIsPerson = (address: string) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [address],
    enabled: !!address,
  })
}
