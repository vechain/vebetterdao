import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()

/**
 * Returns the query key for fetching the isPerson status at a given block number.
 * @param user - The user address.
 * @param blockNumber - The block number.
 * @returns The query key for fetching the isPerson status at a given block number.
 */
export const getIsPersonAtTimepointQueryKey = (user: string, blockNumber: string) => {
  return getCallKey({ method: "isPersonAtTimepoint", keyArgs: [user, blockNumber] })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract.
 * @param user - The user address.
 * @param blockNumber - The block number.
 * @returns The isPerson status at a given block number.
 */
export const useIsPersonAtTimepoint = (user?: string | null, blockNumber?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "isPersonAtTimepoint",
    args: [user, blockNumber],
    enabled: !!user && !!blockNumber,
  })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract for the current user.
 * @param blockNumber - The block number.
 * @returns The isPerson status.
 */
export const useIsUserPersonAtTimepoint = (blockNumber?: string | null) => {
  const { account } = useWallet()
  return useIsPersonAtTimepoint(account, blockNumber)
}
