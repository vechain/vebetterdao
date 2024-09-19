import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { useConnex } from "@vechain/dapp-kit-react"
import { VeBetterPassport__factory } from "@repo/contracts"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()

const VE_BETTER_PASSPORT_CONTRACT = getConfig().veBetterPassportContractAddress

/**
 * Get the participation score threshold from the VeBetterPassport contract
 * @param thor - Connex thor instance
 * @returns the participation score threshold as a number
 */
export const getParticipationScoreThreshold = async (thor: Connex.Thor) => {
  const functionFragment = VeBetterPassportInterface.getFunction("thresholdParticipationScore").format("json")
  const res = await thor.account(VE_BETTER_PASSPORT_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return Number(res.decoded[0])
}

export const getParticipationScoreThresholdQueryKey = () => ["vebetterpassport", "participationScoreThreshold"]

/**
 * Hook to get the participation score threshold from the VeBetterPassport contract
 * @returns the participation score threshold as a number
 */
export const useParticipationScoreThreshold = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getParticipationScoreThresholdQueryKey(),
    queryFn: () => getParticipationScoreThreshold(thor),
    enabled: !!thor,
  })
}
