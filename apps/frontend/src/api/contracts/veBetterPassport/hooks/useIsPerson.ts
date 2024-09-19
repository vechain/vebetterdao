import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

const VE_BETTER_PASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress

/**
 * Get whether an address is a person according to the VeBetterPassport contract
 * @param thor - Connex thor instance
 * @param address - the address to check
 * @returns true if the address is a person, false otherwise
 */
export const getIsPerson = async (thor: Connex.Thor, address: string): Promise<boolean> => {
  const functionFragment = VeBetterPassportInterface.getFunction("isPerson").format("json")
  const res = await thor.account(VE_BETTER_PASSPORT_CONTRACT).method(JSON.parse(functionFragment)).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

export const getIsPersonQueryKey = (address: string) => ["vebetterpassport", "isPerson", address]

/**
 * Hook to get whether an address is a person according to the VeBetterPassport contract
 * @param address - the address to check
 * @returns true if the address is a person, false otherwise
 */
export const useIsPerson = (address: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsPersonQueryKey(address),
    queryFn: () => getIsPerson(thor, address),
  })
}
