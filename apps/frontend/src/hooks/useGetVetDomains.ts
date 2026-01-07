import { useQuery } from "@tanstack/react-query"
import { vnsUtils } from "@vechain/sdk-network"
import { useThor } from "@vechain/vechain-kit"

export const useGetVetDomains = (addresses?: `0x${string}`[]) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["getVetDomains", addresses],
    queryFn: () => vnsUtils.lookupAddresses(thor, addresses!),
    enabled: !!addresses && addresses.length > 0,
  })
}

export const useGetAddressFromVetDomains = (domains?: string[]) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["getAddressFromVetDomains", domains],
    queryFn: () => vnsUtils.resolveNames(thor.blocks, thor.transactions, domains!),
    enabled: !!domains && domains.length > 0,
  })
}
