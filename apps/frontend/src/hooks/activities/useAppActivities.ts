import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"

import { ActivityItem, ActivityType } from "./types"

export const useAppActivities = (): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: xApps, isLoading: isXAppsLoading } = useXApps()
  const { data: currentRoundId, isLoading: isRoundLoading } = useCurrentAllocationsRoundId()

  const isLoading = isXAppsLoading || isRoundLoading

  const data = useMemo((): ActivityItem[] => {
    if (!xApps || !currentRoundId) return []

    const roundId = currentRoundId.toString()
    const nowTimestamp = Math.floor(Date.now() / 1000)
    const items: ActivityItem[] = []

    for (const app of xApps.newApps) {
      const date = Number(app.createdAtTimestamp) || nowTimestamp
      items.push({
        type: ActivityType.APP_NEW,
        date,
        roundId,
        title: app.name,
        metadata: { appId: app.id, appName: app.name },
      })
    }

    for (const app of xApps.endorsed) {
      items.push({
        type: ActivityType.APP_ENDORSEMENT_REACHED,
        date: nowTimestamp,
        roundId,
        title: app.name,
        metadata: { appId: app.id, appName: app.name },
      })
    }

    for (const app of xApps.endorsementLost) {
      items.push({
        type: ActivityType.APP_ENDORSEMENT_LOST,
        date: nowTimestamp,
        roundId,
        title: app.name,
        metadata: { appId: app.id, appName: app.name },
      })
    }

    return items
  }, [xApps, currentRoundId])

  return { data, isLoading }
}
