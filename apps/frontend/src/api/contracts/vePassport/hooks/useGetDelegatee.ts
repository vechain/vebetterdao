import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()

/**
 * Returns the query key for fetching the delegatee.
 * @param delegator - The delegator address.
 * @returns The query key for fetching the delegatee.
 */
export const getDelegateeQueryKey = (delegator: string) => {
  return getCallKey({ method: "getDelegatee", keyArgs: [delegator] })
}

/**
 * Hook to get the delegatee from the VeBetterPassport contract.
 * @param delegator - The delegator address.
 * @returns The address of the delegatee for the given delegator.
 */
export const useGetDelegatee = (delegator?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method: "getDelegatee",
    args: [delegator],
    enabled: !!delegator,
  })
}

/**
 * Hook to get the delegatee from the VeBetterPassport contract for the current user.
 * @returns The address of the delegatee for the current user.
 */
export const useGetUserDelegatee = () => {
  const { account } = useWallet()
  return useGetDelegatee(account)
}
