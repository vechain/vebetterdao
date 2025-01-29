import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"
import { getXApps } from "../getXApps"

export const getXAppsQueryKey = () => ["getXApps"]

/**
 *  Hook to get all the available xApps in the B3TR ecosystem
 * @returns all the available xApps in the B3TR ecosystem capped to 256
 */
export const useXApps = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getXAppsQueryKey(),
    queryFn: async () => await getXApps(thor),
    enabled: !!thor,
  })
}
