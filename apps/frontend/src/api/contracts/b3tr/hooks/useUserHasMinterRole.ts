import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useMinterRoleValue } from "./useB3trMinterRoleValue"
import { B3trContractJson } from "@repo/contracts"
const b3trAbi = B3trContractJson.abi

const B3TR_CONTRACT = getConfig().b3trContractAddress

/**
 *  Check if the address has a specified role in the contract
 * @param thor  The thor instance
 * @param address  The address to check the role for. If not provided, will return an error (for better react-query DX)
 * @param role  The role to check for. If not provided, will return an error (for better react-query DX)
 * @returns {Promise<boolean>} Whether the address has the role
 */
export const getUserHasRole = async (thor: Connex.Thor, role?: string, address?: string): Promise<boolean> => {
  if (!address) return Promise.reject(new Error("Address not provided"))
  if (!role) return Promise.reject(new Error("Role not provided"))
  const functionAbi = b3trAbi.find(e => e.name === "hasRole")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for hasRole"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call(role, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

const getUserHasRoleQueryKey = (role?: string, address?: string) => ["userHasRole", role, address]
export const useUserHasRole = (role?: string, address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getUserHasRoleQueryKey(role, address),
    queryFn: () => getUserHasRole(thor, role, address),
    enabled: !!role && !!address,
  })
}

export const useUserHasMinterRole = (address?: string) => {
  const { thor } = useConnex()

  const { data: role } = useMinterRoleValue()

  return useQuery({
    queryKey: getUserHasRoleQueryKey(role, address),
    queryFn: () => getUserHasRole(thor, role, address),
    enabled: !!role && !!address,
  })
}
