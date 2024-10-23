import { useEffect, useMemo, useState } from "react"
import { useXApps, XApp } from "../../xApps"
import { getSustainabilityActions, SustainabilityActionsResponse } from "@/api"

type Props = {
  startTimestamp: number
  endTimestamp: number
}

interface AppData {
  actions: SustainabilityActionsResponse["data"]
  name: string
  minTimestamp: number // Timestamp of the earliest action
  maxTimestamp: number // Timestamp of the latest action
}

export const useAppsSustainabilityActions = ({ startTimestamp, endTimestamp }: Props) => {
  const { data: xApps } = useXApps()
  const [actionsByApp, setActionsByApp] = useState<{ [appId: string]: AppData }>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!xApps) return

    const appIds = xApps.map((app: XApp) => app.id)

    const fetchActionsForApp = async (
      appId: string,
      after?: number,
      before?: number,
      pageParam = 0,
    ): Promise<SustainabilityActionsResponse> => {
      const result = await getSustainabilityActions({
        appId,
        after,
        before,
        page: pageParam,
        size: 150,
        direction: "asc",
      })
      return result
    }

    const fetchAllActions = async () => {
      if (isLoading) return

      const newActionsByApp = { ...actionsByApp }

      setIsLoading(true)

      const promises = appIds.map(async appId => {
        const appName = xApps.find(app => app.id === appId)?.name
        const appData = actionsByApp[appId] || {
          actions: [],
          name: appName ?? "",
          minTimestamp: Number.MAX_SAFE_INTEGER,
          maxTimestamp: 0,
        }

        let appActions = appData.actions

        let pageParam = 0
        let hasNext = true
        while (hasNext) {
          const result = await fetchActionsForApp(appId, startTimestamp, endTimestamp, pageParam)
          appActions = appActions.concat(result.data)
          hasNext = result.pagination.hasNext
          pageParam += 1
          if (result.data.length > 0) {
            appData.minTimestamp = Math.min(appData.minTimestamp, ...result.data.map(a => a.blockTimestamp))
            appData.maxTimestamp = Math.max(appData.maxTimestamp, ...result.data.map(a => a.blockTimestamp))
          } else {
            break
          }
        }

        // Update appData
        newActionsByApp[appId] = {
          actions: appActions,
          name: appData.name,
          minTimestamp: appData.minTimestamp,
          maxTimestamp: appData.maxTimestamp,
        }
      })

      await Promise.all(promises)

      setIsLoading(false)

      setActionsByApp(newActionsByApp)
    }

    fetchAllActions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xApps, startTimestamp, endTimestamp])

  // Combine and filter actions within the specified timestamps
  const allActions = useMemo(() => {
    const actions = Object.values(actionsByApp).flatMap(appData => appData.actions)
    return actions.filter(action => {
      const ts = action.blockTimestamp
      return (!startTimestamp || ts >= startTimestamp) && (!endTimestamp || ts <= endTimestamp)
    })
  }, [actionsByApp, startTimestamp, endTimestamp])

  return { allActions, actionsByApp, isLoading }
}
