import { useQuery } from "@tanstack/react-query"
import { B3trBadgeContractJson } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
const b3trBadgeAbi = B3trBadgeContractJson.abi

const B3TR_BADGE_CONTRACT = getConfig().nftBadgeContractAddress

export const getParticipatedInGovernance = async (thor: Connex.Thor, address: null | string) => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionAbi = b3trBadgeAbi.find(e => e.name === "participatedInGovernance")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for participatedInGovernance"))
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(functionAbi).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getParticipatedInGovernanceKey = (address: null | string) => [
  "participatedInGovernance",
  "b3trBadge",
  address,
]
export const useParticipatedInGovernance = (address: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getParticipatedInGovernanceKey(address),
    queryFn: () => getParticipatedInGovernance(thor, address),
    enabled: !!address,
  })
}
