import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractAddress = getConfig().voterRewardsContractAddress
const contractInterface = VoterRewards__factory.createInterface()
const method = "levelToMultiplier"

export const getLevelMultiplierQueryKey = (level?: string) => getCallKey({ method, keyArgs: [level] })

const scaledWeight = (weight: number) => weight / 100

export const useLevelMultiplier = (level: string, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [level],
    enabled: !!level && enabled,
    mapResponse: res => scaledWeight(Number(res.decoded[0])),
  })
}
