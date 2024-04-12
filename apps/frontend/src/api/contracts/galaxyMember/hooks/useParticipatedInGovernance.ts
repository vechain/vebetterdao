import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { GalaxyMember__factory } from "@repo/contracts"

const GALAXY_MEMBER_CONTRACT = getConfig().galaxyMemberContractAddress

export const getParticipatedInGovernance = async (thor: Connex.Thor, address: null | string) => {
  if (!address) return Promise.reject(new Error("Address not provided"))

  const functionFragment = GalaxyMember__factory.createInterface()
    .getFunction("participatedInGovernance")
    .format("json")
  const res = await thor.account(GALAXY_MEMBER_CONTRACT).method(JSON.parse(functionFragment)).call(address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getParticipatedInGovernanceQueryKey = (address: null | string) => [
  "participatedInGovernance",
  "galaxyMember",
  address,
]

/**
 * Get whether an address has participated in governance
 *
 * @param address the address to know if they have participated in governance
 * @returns whether the address has participated in governance
 */
export const useParticipatedInGovernance = (address: null | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getParticipatedInGovernanceQueryKey(address),
    queryFn: () => getParticipatedInGovernance(thor, address),
    enabled: !!address,
  })
}
