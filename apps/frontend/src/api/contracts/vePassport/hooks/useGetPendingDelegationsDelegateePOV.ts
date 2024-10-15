import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "getPendingDelegations"

/**
 * Returns the query key for fetching pending delegations.
 * @param delegatee - The delegatee address.
 * @returns The query key for fetching pending delegations.
 */
export const getPendingDelegationsQueryKeyDelegateePOV = (delegatee: string) => {
  return getCallKey({ method, keyArgs: ["incoming", delegatee] })
}

/**
 * Hook to get pending delegations from the VeBetterPassport contract.
 * @param delegatee - The delegatee address.
 * @returns An array of addresses representing delegators with pending delegations for the delegatee.
 */
export const useGetPendingDelegationsDelegateePOV = (delegatee?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    keyArgs: ["incoming", delegatee],
    args: [delegatee],
    mapResponse: response => response.decoded[0] ?? [],
    enabled: !!delegatee,
  })
}

/**
 * Hook to get pending delegations from the VeBetterPassport contract for the current user.
 * @returns An array of addresses representing delegators with pending delegations for the current user.
 */
export const useGetUserPendingDelegationsDelegateePOV = () => {
  const { account } = useWallet()
  return useGetPendingDelegationsDelegateePOV(account)
}
