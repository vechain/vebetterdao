import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getHasRole } from "./useHasRole"

const hasRolesQueryKey = (roles: string[], contractAddress: string, address: string) => [
  "hasRoles",
  contractAddress,
  address,
  roles,
]
/**
 *  Hook to check if the user has a list of specific roles
 * @param roles  the roles to check (will be converted to bytes32)
 * @param contractAddress  the contract address
 * @param address  the address to check the role for
 * @returns  true if the user has the role, false otherwise
 */
export const useHasRoles = (roles: string[], contractAddress: string, address: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: hasRolesQueryKey(roles, contractAddress, address),
    queryFn: () => Promise.all(roles.map(role => getHasRole(thor, role, contractAddress, address))),
  })
}
