import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { AccessControl__factory } from "@repo/contracts/typechain-types"
import { getBytes32Role } from "./useHasRole"

const abi = AccessControl__factory.abi
const method = "hasRole" as const

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
    queryFn: async () => {
      return await executeMultipleClausesCall({
        thor,
        calls: roles.map(
          role =>
            ({
              abi,
              functionName: method,
              address: contractAddress as `0x${string}`,
              args: [getBytes32Role(role) as `0x${string}`, address as `0x${string}`],
            }) as const,
        ),
      })
    },
  })
}
