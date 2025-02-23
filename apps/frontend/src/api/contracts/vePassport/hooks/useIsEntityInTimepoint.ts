import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "isEntityInTimepoint"

/**
 * Returns the query key for checking if an address is an entity in a specific timepoint.
 * @param address - The address to check.
 * @param timepoint - The timepoint to check.
 * @returns The query key for checking if an address is an entity in a specific timepoint.
 */
export const getIsEntityInTimepointQueryKey = (address?: string | null, timepoint?: number | null) => {
  return getCallKey({ method, keyArgs: [address, timepoint] })
}

// refetch keyy if the link / unlink operation are triggered
export const getIsEntityInTimepointRefetchKey = (address?: string | null, timepoint?: number | null) => {
  return getCallKey({ method, keyArgs: [address, timepoint] })
}

/**
 * Hook to check if an address is an entity using the VeBetterPassport contract.
 * @param address - The address to check.
 * @returns A boolean indicating whether the address is an entity.
 */
export const useIsEntityInTimepoint = (address?: string | null, timepoint?: number | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [address, timepoint],
    enabled: !!address,
  })
}

/**
 * Hook to check if the current user's address is an entity using the VeBetterPassport contract.
 * @returns A boolean indicating whether the current user's address is an entity.
 */
export const useIsUserEntityInTimepoint = () => {
  const { account } = useWallet()
  return useIsEntityInTimepoint(account)
}
