import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import Contract from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import { getConfig } from "@repo/config"
const vot3Abi = Contract.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 *  Get the vot3 balance of an address from the contract
 * @param thor  The thor instance
 * @param address  The address to check the delegates of. If not provided, will return an error (for better react-query DX)
 * @returns the address chosen as delegate
 */
export const getVot3Delegates = async (thor: Connex.Thor, address?: string): Promise<string> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  const functionAbi = vot3Abi.find(e => e.name === "delegates")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

/**
 * Return the address the user has delegated his votes to (if any)
 * @param address the address of the user
 * @returns  the address the user has delegated his votes to (if any)
 */
export const getVot3DelegatesQueryKey = (address?: string) => ["vot3", "delegates", address]
export const useVot3Delegates = (address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVot3DelegatesQueryKey(address),
    queryFn: () => getVot3Delegates(thor, address),
    enabled: !!address,
  })
}
