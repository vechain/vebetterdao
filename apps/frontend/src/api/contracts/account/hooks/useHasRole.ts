import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"
import { AccessControl__factory } from "@repo/contracts/typechain-types"

export const MINTER_ROLE = ethers.solidityPackedKeccak256(["string"], ["MINTER_ROLE"])
export const UPGRADER_ROLE = ethers.solidityPackedKeccak256(["string"], ["UPGRADER_ROLE"])
export const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"

/**
 *  Function to check if the user has a specific role in AccessControl
 * @param thor  the thor instance
 * @param role  the role to check
 * @param contractAddress  the contract address
 * @returns  true if the user has the role, false otherwise
 */
export const getHasRole = async (thor: Connex.Thor, role: string, contractAddress: string, address?: string) => {
  const fragment = AccessControl__factory.createInterface().getFunction("hasRole").format("json")
  const res = await thor.account(contractAddress).method(JSON.parse(fragment)).call(role, address)

  if (res.reverted) throw new Error(res.revertReason)

  return res.decoded[0]
}

export const hasRoleQueryKey = (role: string, contractAddress: string, address?: string) => [
  "hasRole",
  contractAddress,
  address,
  role,
]

/**
 *  Hook to check if the user has a specific role
 * @param role  the role to check
 * @returns  true if the user has the role, false otherwise
 */
export const useHasRole = (role: string, contractAddress: string, address?: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: hasRoleQueryKey(role, contractAddress, address),
    queryFn: () => !!address && getHasRole(thor, role, contractAddress, address),
    enabled: !!address,
  })
}
