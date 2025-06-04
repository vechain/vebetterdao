import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { GetAllApps } from "../getXApps"
import { sortXAppsAlphabetically } from "../sortXAppsAlphabetically"

export const useSortXappAlphabetically = (xAppsNotSorted: GetAllApps | undefined) => {
  const thor = useThor()
  return useQuery({
    queryKey: ["sortedXApps", xAppsNotSorted],
    queryFn: () => sortXAppsAlphabetically(xAppsNotSorted, thor),
    enabled: !!xAppsNotSorted && !!thor,
  })
}
