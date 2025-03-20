import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/vechain-kit"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()

/**
 * Returns the query key for fetching the isPerson status.
 * @param user - The user address.
 * @returns The query key for fetching the isPerson status.
 */
export const getIsPersonQueryKey = (user: string) => {
  return getCallKey({ method: "isPerson", keyArgs: [user] })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract.
 * @param user - The user address.
 * @returns The isPerson status.
 */
export const useIsPerson = (user?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "isPerson",
    args: [user],
    enabled: !!user,
  })
}

/**
 * Hook to get the isPerson status from the VeBetterPassport contract for the current user.
 * @returns The isPerson status.
 */
export const useIsUserPerson = () => {
  const { account } = useWallet()
  return useIsPerson(account?.address)
}
