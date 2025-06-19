import { useEffect, useState, useRef } from "react"
import { useXApps, XApp } from "@vechain/vechain-kit"
import {
  getSustainabilityAppUsersByRound,
  SustainabilityAppUsersByRoundResponse,
} from "@/api/indexer/sustainability/useSustainabilityAppUsersByRound"
import {
  getSustainabilityAppOverviewByRound,
  SustainabilityAppOverViewByRoundResponse,
} from "@/api/indexer/sustainability/useSustainabilityAppOverviewByRound"

type Props = {
  startRound: number
  endRound: number
}

export interface AppActionsData {
  actions: number
  name: string
  totalRewardAmount: number
  totalImpact: Record<string, number>
}

export interface AppUsersData {
  user: string
  appName: string
  totalActions: number
  totalRewardAmount: number
}

export const useAppsSustainabilityActions = ({ startRound, endRound }: Props) => {
  const { data: xApps } = useXApps()

  const [appActions, setAppActions] = useState<{ [appId: string]: AppActionsData }>({})
  const [appUsers, setAppUsers] = useState<{ [appId: string]: AppUsersData[] }>({})

  const [isLoading, setIsLoading] = useState(false)
  const isLoadingRef = useRef(false)
  const [loadedAppCount, setLoadedAppCount] = useState(0) // Track fully loaded apps
  const totalAppCount = xApps?.allApps?.length ?? 0

  useEffect(() => {
    if (!xApps) return

    const appIds = xApps?.allApps.map((app: XApp) => app.id)

    // Fetch actions and aggregated data for each app and round
    const fetchActionsForApp = async (appId: string): Promise<void> => {
      const aggregatedData = { actions: 0, totalRewardAmount: 0, totalImpact: {} as Record<string, number> }

      for (let round = startRound; round <= endRound; round++) {
        let page = 0
        let hasNext = true

        // Fetch all pages for the current round
        while (hasNext) {
          const result: SustainabilityAppOverViewByRoundResponse = await getSustainabilityAppOverviewByRound({
            appId,
            roundId: round,
            page,
            size: 1000,
            direction: "asc",
          })

          if (result?.data) {
            result.data.forEach(day => {
              aggregatedData.actions += day.actionsRewarded
              aggregatedData.totalRewardAmount += day.totalRewardAmount
              Object.entries(day.totalImpact || {}).forEach(([key, value]) => {
                aggregatedData.totalImpact[key] = (aggregatedData.totalImpact[key] || 0) + (value ?? 0)
              })
            })
          }

          hasNext = result.pagination.hasNext
          page += 1
        }
      }

      const name = xApps?.allApps.find(app => app.id === appId)?.name ?? ""

      setAppActions(prev => ({
        ...prev,
        [appId]: {
          name,
          ...aggregatedData,
        },
      }))
    }

    // Fetch user-specific data for each app and round
    const fetchUsersForApp = async (appId: string): Promise<void> => {
      const userAggregatedData: { [user: string]: AppUsersData } = {}

      const appName = xApps?.allApps.find(app => app.id === appId)?.name ?? ""

      for (let round = startRound; round <= endRound; round++) {
        let page = 0
        let hasNext = true

        while (hasNext) {
          const result: SustainabilityAppUsersByRoundResponse = await getSustainabilityAppUsersByRound({
            appId,
            roundId: round,
            page,
            size: 1000,
            direction: "asc",
            sortBy: "actionsRewarded",
          })

          if (result?.data) {
            result.data.forEach(userEntry => {
              const { user, actionsRewarded, totalRewardAmount } = userEntry
              if (!userAggregatedData[user]) {
                userAggregatedData[user] = { user, totalActions: 0, totalRewardAmount: 0, appName }
              }

              const userData = userAggregatedData[user]

              if (userData) {
                userData.totalActions += actionsRewarded
                userData.totalRewardAmount += totalRewardAmount
              }
            })
          }

          hasNext = result.pagination.hasNext
          page += 1
        }
      }

      setAppUsers(prev => ({
        ...prev,
        [appId]: Object.values(userAggregatedData),
      }))
    }

    // Fetch all data for the selected rounds and apps
    const fetchAllData = async () => {
      if (isLoadingRef.current) return
      if (!startRound || !endRound) return

      isLoadingRef.current = true
      setIsLoading(true)

      await Promise.all(
        appIds.map(async appId => {
          await fetchActionsForApp(appId)
          await fetchUsersForApp(appId)
          setLoadedAppCount(prev => prev + 1) // Increment for each fully loaded app
        }),
      )

      isLoadingRef.current = false
      setIsLoading(false)
    }

    fetchAllData()
  }, [xApps, startRound, endRound])

  return {
    appActions,
    appUsers,
    isLoading,
    loadedAppCount,
    totalAppCount,
    setLoadedAppCount,
  }
}
