import { useQuery } from "@tanstack/react-query"
import { useXAppsMetadataBaseUri } from "@vechain/vechain-kit"

import { GetAllApps } from "../getXApps"
import { sortXAppsAlphabetically } from "../sortXAppsAlphabetically"

export const useSortXappAlphabetically = (xAppsNotSorted: GetAllApps | undefined) => {
  const { data } = useXAppsMetadataBaseUri()
  const [baseUri = ""] = data || []

  return useQuery({
    queryKey: ["sortedXApps", xAppsNotSorted?.allApps.map(app => app.id)],
    queryFn: () =>
      sortXAppsAlphabetically({
        apps: xAppsNotSorted,
        baseUri,
      }),
    enabled: !!xAppsNotSorted && !!baseUri,
  })
}
