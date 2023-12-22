import { useQuery } from "@tanstack/react-query"
import { getB3trBalance, getB3trTokenDetails } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

export const getB3TrTokenDetailsQueryKey = () => ["b3trTokenDetails"]
export const useB3trTokenDetails = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getB3TrTokenDetailsQueryKey(),
    queryFn: () => getB3trTokenDetails(thor),
  })
}

export const getB3TrBalanceQueryKey = (address?: string) => ["b3trBalance", address]
export const useB3trBalance = (address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getB3TrBalanceQueryKey(address),
    queryFn: () => getB3trBalance(thor, address),
    enabled: !!address,
  })
}
