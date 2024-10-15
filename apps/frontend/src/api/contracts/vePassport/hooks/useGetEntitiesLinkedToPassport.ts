import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "getEntitiesLinkedToPassport"

/**
 * Returns the query key for fetching entities linked to a passport.
 * @param passport - The passport address.
 * @returns The query key for fetching entities linked to a passport.
 */
export const getEntitiesLinkedToPassportQueryKey = (passport?: string | null) => {
  return getCallKey({ method, keyArgs: [passport] })
}

/**
 * Hook to get the entities linked to a passport from the VeBetterPassport contract.
 * @param passport - The passport address.
 * @returns An array of entity addresses linked to the given passport.
 */
export const useGetEntitiesLinkedToPassport = (passport?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    args: [passport],
    enabled: !!passport,
  })
}

/**
 * Hook to get the entities linked to the current user's passport from the VeBetterPassport contract.
 * @returns An array of entity addresses linked to the current user's passport.
 */
export const useGetUserEntitiesLinkedToPassport = () => {
  const { account } = useWallet()
  return useGetEntitiesLinkedToPassport(account)
}
