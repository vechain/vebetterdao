import { useQuery } from "@tanstack/react-query"
import { getMinterRoleValue, getUserHasRole } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

const getMinterRoleValueQueryKey = () => ["minterRoleValue"]
export const useMinterRoleValue = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getMinterRoleValueQueryKey(),
    queryFn: () => getMinterRoleValue(thor),
  })
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
