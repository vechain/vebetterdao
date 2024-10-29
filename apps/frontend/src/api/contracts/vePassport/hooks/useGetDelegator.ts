import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { ZeroAddress } from "ethers"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()

/**
 * Returns the query key for fetching the delegator.
 * @param delegator - The delegator address.
 * @returns The query key for fetching the delegator.
 */
export const getDelegatorQueryKey = (delegator: string) => {
  return getCallKey({ method: "getDelegator", keyArgs: [delegator] })
}

/**
 * Hook to get the delegator from the VeBetterPassport contract.
 * @param delegator - The delegator address.
 * @returns The address of the delegator for the given delegator address, or null if the delegator has no delegator.
 */
export const useGetDelegator = (delegator?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "getDelegator",
    args: [delegator],
    mapResponse: response => {
      const delegator = response.decoded[0]
      if (compareAddresses(delegator, ZeroAddress)) return null
      return delegator
    },
    enabled: !!delegator,
  })
}
