import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
// const method = "getPendingDelegationsDelegatorPOV"
const method = "getPendingDelegations"

/**
 * Returns the query key for fetching pending delegations.
 * @param delegator - The delegator address.
 * @returns The query key for fetching pending delegations.
 */
export const getPendingDelegationsQueryKeyDelegatorPOV = (delegator: string) => {
  return getCallKey({ method, keyArgs: [delegator] })
}

/**
 * Hook to get pending delegations from the VeBetterPassport contract.
 * @param delegator - The delegator address.
 * @returns An array of addresses representing delegators with pending delegations for the delegator.
 */
export const useGetPendingDelegationsDelegatorPOV = (delegator?: string | null) => {
  // TODO: remove mocked data
  const pendingDelegations: string[] = []
  return { data: pendingDelegations, isLoading: false }
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [delegator],
    enabled: !!delegator,
  })
}

/**
 * Hook to get pending delegations from the VeBetterPassport contract for the current user.
 * @returns An array of addresses representing delegators with pending delegations for the current user.
 */
export const useGetUserPendingDelegationsDelegatorPOV = () => {
  const { account } = useWallet()
  return useGetPendingDelegationsDelegatorPOV(account)
}
