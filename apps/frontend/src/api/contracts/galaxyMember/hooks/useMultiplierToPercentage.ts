import { getCallKey } from "@/hooks"
import { useQuery } from "@tanstack/react-query"
import { useGMMaxLevel } from "./useGMMaxLevel"

export const getMultiplierToPercentageQueryKey = (multiplier?: string) =>
  getCallKey({ method: "GM_Pool_percentage", keyArgs: [multiplier] })

const multiplierToPercentageOfGalaxyPool = (multiplier: number, totalMultiplier: number) =>
  (multiplier / totalMultiplier) * 100

export const useMultiplierToPercentage = (multiplier: string) => {
  const { data: maxGmLevel } = useGMMaxLevel()

  return useQuery({
    queryKey: getMultiplierToPercentageQueryKey(multiplier),
    queryFn: () => multiplierToPercentageOfGalaxyPool(Number(multiplier), maxGmLevel),
  })
}
