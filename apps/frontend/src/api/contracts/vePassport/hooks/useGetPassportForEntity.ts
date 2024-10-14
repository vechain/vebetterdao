import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts/typechain-types"
import { useWallet } from "@vechain/dapp-kit-react"

const VEPASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress
const vePassportInterface = VeBetterPassport__factory.createInterface()
const method = "getPassportForEntity"

/**
 * Returns the query key for fetching the passport for an entity.
 * @param entity - The entity address.
 * @returns The query key for fetching the passport for an entity.
 */
export const getPassportForEntityQueryKey = (entity?: string | null) => {
  return getCallKey({ method, keyArgs: [entity] })
}

/**
 * Hook to get the passport for an entity from the VeBetterPassport contract.
 * @param entity - The entity address.
 * @returns The passport address for the given entity.
 */
export const useGetPassportForEntity = (entity?: string | null) => {
  return useCall({
    contractInterface: vePassportInterface,
    contractAddress: VEPASSPORT_CONTRACT,
    method,
    keyArgs: [entity],
    args: [entity],
    enabled: !!entity,
  })
}

/**
 * Hook to get the passport for the current user's entity from the VeBetterPassport contract.
 * @returns The passport address for the current user's entity.
 */
export const useGetUserPassportForEntity = () => {
  const { account } = useWallet()
  return useGetPassportForEntity(account)
}
