import { compareAddresses, isValid } from "@repo/utils/AddressUtils"
import { useQuery } from "@tanstack/react-query"
import { getAddress } from "@vechain.energy/dapp-kit-hooks"
import { useConnex } from "@vechain/dapp-kit-react"

export const useResolveAddressOrVetDomain = (addressOrVetDomain: string) => {
  const connex = useConnex()

  return useQuery({
    queryKey: ["RESOLVE_ADDRESS_OR_VET_DOMAIN", addressOrVetDomain],
    queryFn: async () => {
      const isAddress = isValid(addressOrVetDomain)
      if (isAddress) return { address: addressOrVetDomain }
      const isPossibleVet = addressOrVetDomain.endsWith(".vet")
      if (!isPossibleVet) throw new Error("Invalid address or vet domain")

      const response = await getAddress(addressOrVetDomain, connex)
      if (compareAddresses(response, "0x0000000000000000000000000000000000000000"))
        throw new Error("Vet domain not found")

      return { address: response, vetDomain: addressOrVetDomain }
    },
    enabled: !!addressOrVetDomain,
  })
}
