import { useQuery } from "@tanstack/react-query"

import { GetAllApps } from "../getXApps"
import { sortXAppsAlphabetically } from "../sortXAppsAlphabetically"
import { useXAppsMetadataBaseUri } from "./useXAppsMetadataBaseUri"

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
