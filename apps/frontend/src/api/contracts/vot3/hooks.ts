import { useQuery } from "@tanstack/react-query"
import { getVot3Balance, getVot3Delegates, getVot3TokenDetails } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

export const getVot3TokenDetailsQueryKey = () => ["tokenDetails", "vot3"]
export const useVot3TokenDetails = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVot3TokenDetailsQueryKey(),
    queryFn: () => getVot3TokenDetails(thor),
  })
}

export const getVot3BalanceQueryKey = (address?: string) => ["balance", "vot3", address]
export const useVot3Balance = (address?: string) => {
  const { thor } = useConnex()
  const { data: tokenDetails } = useVot3TokenDetails()

  return useQuery({
    queryKey: getVot3BalanceQueryKey(address),
    queryFn: () => getVot3Balance(thor, address, tokenDetails?.decimals),
    enabled: !!address && !!tokenDetails?.decimals,
  })
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
