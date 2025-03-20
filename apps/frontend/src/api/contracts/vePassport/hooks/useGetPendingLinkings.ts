import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/vechain-kit"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "getPendingLinkings"

/**
 * Returns the query key for fetching pending linkings.
 * @param user - The user address.
 * @returns The query key for fetching pending linkings.
 */
export const getPendingLinkingsQueryKey = (user?: string | null) => {
  return getCallKey({ method, keyArgs: [user] })
}

/**
 * Hook to get pending linkings from the VeBetterPassport contract.
 * @param user - The user address.
 * @returns An object containing incoming and outgoing pending linkings for the user.
 */
export const useGetPendingLinkings = (user?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [user],
    mapResponse: response => ({
      incoming: response.decoded[0] ?? [],
      outgoing: response.decoded[1] ?? null,
    }),
    enabled: !!user,
  })
}

/**
 * Hook to get pending linkings from the VeBetterPassport contract for the current user.
 * @returns An object containing incoming and outgoing pending linkings for the current user.
 */
export const useGetUserPendingLinkings = () => {
  const { account } = useWallet()
  return useGetPendingLinkings(account?.address)
}
