import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { B3TRBadge__factory } from "@repo/contracts"

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

export const getParticipatedInGovernance = async (thor: Connex.Thor, address: null | string) => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionFragment = B3TRBadge__factory.createInterface().getFunction("participatedInGovernance").format("json")
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(JSON.parse(functionFragment)).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getParticipatedInGovernanceQueryKey = (address: null | string) => [
  "participatedInGovernance",
  "b3trBadge",
  address,
]

/**
 * Get the number of b3tr badges for an address
 * @param address the address to get the number of b3tr badges for
 * @returns the number of b3tr badges for the address
 */
export const useParticipatedInGovernance = (address: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getParticipatedInGovernanceQueryKey(address),
    queryFn: () => getParticipatedInGovernance(thor, address),
    enabled: !!address,
  })
}
