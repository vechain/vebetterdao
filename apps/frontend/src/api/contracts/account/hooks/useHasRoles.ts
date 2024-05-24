import { useQueries, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getHasRole, hasRoleQueryKey } from "./useHasRole"

/**
 *  Hook to check if the user has a list of specific roles
 * @param roles  the roles to check (will be converted to bytes32)
 * @param contractAddress  the contract address
 * @param address  the address to check the role for
 * @returns  true if the user has the role, false otherwise
 */
export const useHasRoles = (roles: string[], contractAddress: string, address: string) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()

  return useQueries({
    queries: roles.map(role => ({
      queryKey: hasRoleQueryKey(role, contractAddress, address),
      queryFn: async () => {
        return await queryClient.ensureQueryData({
          queryKey: hasRoleQueryKey(role, contractAddress, address),
          queryFn: () => getHasRole(thor, role, contractAddress, address),
        })
      },
    })),
  })
}
