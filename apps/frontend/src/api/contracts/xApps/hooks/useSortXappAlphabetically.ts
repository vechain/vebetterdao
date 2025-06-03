import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"

import { GetAllApps } from "../getXApps"
import { sortXAppsAlphabetically } from "../sortXAppsAlphabetically"

export const useSortXappAlphabetically = (xAppsNotSorted: GetAllApps | undefined) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: ["sortedXApps", xAppsNotSorted],
    queryFn: () => sortXAppsAlphabetically(xAppsNotSorted, thor),
    enabled: !!xAppsNotSorted,
  })
}
