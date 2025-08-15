import { AppUsersData, useAppsSustainabilityActions, useCurrentAllocationsRoundId } from "@/api"
import { Accordion, Box, ProgressCircle, Grid, Heading, HStack, NativeSelect, Text, VStack } from "@chakra-ui/react"
import { median } from "d3-array"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  ActionsSharePieChart,
  ActiveUsersPerAppChart,
  DrillDownBarChart,
  RewardPerActionChart,
  TopUsersByRewardsChart,
  TopUsersChart,
  TotalActionsPerAppChart,
  TotalRewardsPerAppChart,
  UserAppsChart,
} from "./Charts"

export const StatsPageContent = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  // State variables for round range
  const [startRound, setStartRound] = useState<number>(0)
  const [endRound, setEndRound] = useState<number>(0)
  const [roundOptions, setRoundOptions] = useState<number[]>([])
  const [selectedAppId, setSelectedAppId] = useState<string>("")

  useEffect(() => {
    if (currentRoundId) {
      const rounds = Array.from({ length: 20 }, (_, i) => Number(currentRoundId) - i) // Show up to 20 rounds back
      setRoundOptions(rounds)
      setStartRound(rounds?.[1] ?? 0) // Default to 1 rounds back
      setEndRound(rounds?.[0] ?? 0) // Default to current round
    }
  }, [currentRoundId])

  // Fetch data using the selected round range
  const { appActions, appUsers, isLoading, loadedAppCount, totalAppCount, setLoadedAppCount } =
    useAppsSustainabilityActions({
      startRound,
      endRound,
    })

  const totalActionsPerApp = useMemo(() => {
    return Object.keys(appActions).map(appId => {
      const actions = appActions[appId]
      return {
        appId,
        name: actions?.name ?? "",
        actions: actions?.actions ?? 0,
        amount: actions?.totalRewardAmount ?? 0,
      }
    })
  }, [appActions])

  // Inside your VeBetterPassportData component

  const activeUsersPerApp = useMemo(() => {
    return Object.keys(appUsers).map(appId => {
      const users = appUsers[appId] ?? []
      return {
        appId,
        name: users?.[0]?.appName ?? appId,
        users: users.length,
      }
    })
  }, [appUsers])

  const totalRewardsPerApp = useMemo(() => {
    return Object.keys(appActions).map(appId => {
      const actions = appActions[appId]
      return {
        appId,
        name: actions?.name ?? "",
        rewards: actions?.totalRewardAmount ?? 0,
      }
    })
  }, [appActions])

  const averageRewardPerActionPerApp = useMemo(() => {
    return Object.keys(appActions).map(appId => {
      const actionsData = appActions[appId]
      const totalActions = actionsData?.actions ?? 0
      const totalRewards = actionsData?.totalRewardAmount ?? 0
      const averageReward = totalActions > 0 ? totalRewards / totalActions : 0
      return {
        appId,
        name: actionsData?.name ?? "",
        averageRewardPerAction: averageReward,
      }
    })
  }, [appActions])

  const medianRewardPerActionPerApp = useMemo(() => {
    return Object.keys(appUsers).map(appId => {
      const usersData = appUsers[appId] ?? []
      const rewardsPerAction = usersData
        .filter(user => user.totalActions > 0)
        .map(user => user.totalRewardAmount / user.totalActions)
      const medianReward = median(rewardsPerAction) ?? 0
      return {
        appId,
        name: usersData?.[0]?.appName ?? appId,
        medianRewardPerAction: medianReward,
      }
    })
  }, [appUsers])

  const rewardStatsPerApp = useMemo(() => {
    const averageMap = averageRewardPerActionPerApp.reduce(
      (acc, app) => {
        acc[app.appId] = app
        return acc
      },
      {} as { [appId: string]: (typeof averageRewardPerActionPerApp)[0] },
    )

    return medianRewardPerActionPerApp.map(medianApp => {
      const averageApp = averageMap[medianApp.appId]
      return {
        appId: medianApp.appId,
        name: medianApp.name,
        averageRewardPerAction: averageApp?.averageRewardPerAction ?? 0,
        medianRewardPerAction: medianApp.medianRewardPerAction,
      }
    })
  }, [averageRewardPerActionPerApp, medianRewardPerActionPerApp])

  // A user can be part of multiple apps, aggregate their actions
  const actionsByUsers = useMemo(() => {
    return Object.values(appUsers).reduce(
      (acc, users) => {
        users.forEach(user => {
          // Ensure user entry exists in the accumulator
          acc[user.user] = acc[user.user] || { totalActions: 0, totalRewardAmount: 0 }

          const existingUser = acc[user.user]

          if (existingUser) {
            // Accumulate total actions and reward amounts
            existingUser.totalActions += user.totalActions || 0
            existingUser.totalRewardAmount += user.totalRewardAmount || 0
          }
        })
        return acc
      },
      {} as { [user: string]: { totalActions: number; totalRewardAmount: number } },
    )
  }, [appUsers])

  const topUsers = useMemo(() => {
    return Object.entries(actionsByUsers)
      .map(([user, { totalActions, totalRewardAmount }]) => ({ user, totalActions, totalRewardAmount }))
      .sort((a, b) => b.totalActions - a.totalActions)
      .slice(0, 25)
  }, [actionsByUsers])

  const topUsersByRewards = useMemo(() => {
    return Object.entries(actionsByUsers)
      .map(([user, { totalActions, totalRewardAmount }]) => ({
        user,
        totalActions,
        totalRewardAmount,
        averageRewardPerAction: totalActions > 0 ? totalRewardAmount / totalActions : 0,
      }))
      .sort((a, b) => b.totalRewardAmount - a.totalRewardAmount)
      .slice(0, 25)
  }, [actionsByUsers])

  const topUsersAppActions = useMemo(() => {
    return topUsers.map(({ user }) => {
      const userAppActions: AppUsersData[] = []
      Object.keys(appUsers).forEach(appId => {
        const userActions = appUsers[appId]?.find(userActions => userActions.user === user)
        if (userActions) {
          userAppActions.push(userActions)
        }
      })

      return { userId: user, appActions: userAppActions }
    })
  }, [topUsers, appUsers])

  const topUsersByRewardsAppActions = useMemo(() => {
    return topUsersByRewards.map(({ user }) => {
      const userAppActions: AppUsersData[] = []
      Object.keys(appUsers).forEach(appId => {
        const userActions = appUsers[appId]?.find(userActions => userActions.user === user)
        if (userActions) {
          userAppActions.push(userActions)
        }
      })

      return { userId: user, appActions: userAppActions }
    })
  }, [topUsersByRewards, appUsers])

  const topUsersForSelectedApp = useMemo(() => {
    if (!selectedAppId || !appUsers[selectedAppId]) return []

    const selectedAppUsers = appUsers[selectedAppId]

    if (!selectedAppUsers) return []

    return selectedAppUsers
      .slice() // Create a copy to avoid mutating original data
      .sort((a, b) => b.totalRewardAmount - a.totalRewardAmount)
  }, [selectedAppId, appUsers])

  // Filtered options for the dropdowns to ensure startRound < endRound
  const startRoundOptions = roundOptions.filter(round => round <= endRound && round > 0)
  const endRoundOptions = roundOptions.filter(round => round >= startRound && round > 0)

  // Handlers for dropdown changes
  const onStartRoundChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setLoadedAppCount(0)
      setStartRound(Number(event.target.value))
    },
    [setLoadedAppCount],
  )

  const onEndRoundChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setLoadedAppCount(0)
      setEndRound(Number(event.target.value))
    },
    [setLoadedAppCount],
  )

  if (isLoading) {
    // Calculate loading progress percentage
    const progressPercent = totalAppCount > 0 ? Math.round((loadedAppCount / totalAppCount) * 100) : 0

    return (
      <VStack w="full" gap={8} mt={10}>
        <ProgressCircle.Root value={progressPercent} size="xl">
          <ProgressCircle.Circle css={{ "--thickness": "8px" }}>
            <ProgressCircle.Track stroke="gray.200" />
            <ProgressCircle.Range stroke="teal.400" strokeLinecap="round" />
          </ProgressCircle.Circle>
          <ProgressCircle.Label>
            {progressPercent}
            {"%"}
          </ProgressCircle.Label>
        </ProgressCircle.Root>
        <Text fontSize="lg" color="gray.600">
          {t("Fetching data...")}
        </Text>
      </VStack>
    )
  }

  return (
    <VStack w="full" gap={8} overflow={"clip"}>
      {/* Round Range Dropdowns */}
      <HStack gap={4} alignItems="flex-end" w="full" flexDir={{ base: "column", md: "row" }}>
        <VStack alignItems="flex-start" w="full">
          <Text>{t("Start Round:")}</Text>
          <NativeSelect.Root>
            <NativeSelect.Indicator />
            <NativeSelect.Field value={startRound} onChange={onStartRoundChange} placeholder={t("Select start round")}>
              {startRoundOptions.map(round => (
                <option key={round} value={round}>
                  {t("Round")} {round}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </VStack>
        <VStack alignItems="flex-start" w="full">
          <Text>{t("End Round:")}</Text>
          <NativeSelect.Root>
            <NativeSelect.Indicator />
            <NativeSelect.Field value={endRound} onChange={onEndRoundChange} placeholder={t("Select end round")}>
              {endRoundOptions.map(round => (
                <option key={round} value={round}>
                  {t("Round")} {round}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </VStack>
      </HStack>

      {/* Chart Components */}
      <HStack gap={4} alignItems="flex-end" w="full" flexDir={{ base: "column", md: "row" }}>
        <VStack w="full" gap={4}>
          <Heading size="md">{t("Total Actions per App")}</Heading>
          <TotalActionsPerAppChart data={totalActionsPerApp} />
        </VStack>
        <VStack w="full" gap={4}>
          <Heading size="md">{t("Percentage Share of Actions per App")}</Heading>
          <ActionsSharePieChart data={totalActionsPerApp} />
        </VStack>
      </HStack>
      <HStack gap={4} alignItems="flex-end" w="full" flexDir={{ base: "column", md: "row" }}>
        <VStack w="full" gap={4}>
          <Heading size="md">{t("Active Users per App")}</Heading>
          <ActiveUsersPerAppChart data={activeUsersPerApp} />
        </VStack>
        <VStack w="full" gap={4}>
          <Heading size="md">{t("Total Rewards per App")}</Heading>
          <TotalRewardsPerAppChart data={totalRewardsPerApp} />
        </VStack>
      </HStack>

      <VStack w="full" gap={4}>
        <Heading size="md">{t("Average and Median Reward per Action per App")}</Heading>
        <RewardPerActionChart data={rewardStatsPerApp} />
      </VStack>

      <VStack w="full" gap={4}>
        <Heading size="md">{t("Top Users by Rewards")}</Heading>
        <TopUsersByRewardsChart data={topUsersByRewards} />
      </VStack>

      {/* Additional Components for Users if needed */}
      <VStack w="full" gap={4}>
        <Heading size="md">{t("Top Users by Actions")}</Heading>
        <TopUsersChart data={topUsers} />
      </VStack>
      {/* Accordion for Top Users' Most Used Apps */}
      <VStack w="full" gap={4}>
        <Heading size="md">{t("Top Users' Most Used Apps")}</Heading>
        <Accordion.Root collapsible w="full">
          <Accordion.Item value="top-users-by-actions">
            <Accordion.ItemTrigger>
              <Box flex="1" textAlign="left">
                {t("Top Users by Actions")}
              </Box>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent pb={4}>
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} w="full">
                {topUsersAppActions.map(({ userId, appActions }) => (
                  <UserAppsChart key={userId} userId={userId} appActions={appActions} type="actions" />
                ))}
              </Grid>
            </Accordion.ItemContent>
          </Accordion.Item>

          {/* Top Users by Rewards */}
          <Accordion.Item value="top-users-by-rewards">
            <Accordion.ItemTrigger>
              <Box flex="1" textAlign="left">
                {t("Top Users by Rewards")}
              </Box>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent pb={4}>
              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} w="full">
                {topUsersByRewardsAppActions.map(({ userId, appActions }) => (
                  <UserAppsChart key={userId} userId={userId} appActions={appActions} type="rewards" />
                ))}
              </Grid>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </VStack>

      <VStack w="full" gap={4}>
        <Heading size="md">{t("Top Users by Rewards for Selected App")}</Heading>
        {/* App Selection Dropdown */}
        <VStack alignItems="flex-start" w="full">
          <Text>{t("Select App:")}</Text>
          <NativeSelect.Root>
            <NativeSelect.Indicator />
            <NativeSelect.Field
              value={selectedAppId}
              onChange={event => setSelectedAppId(event.target.value)}
              placeholder={t("Select an app")}>
              {Object.keys(appActions).map(appId => (
                <option key={appId} value={appId}>
                  {appActions[appId]?.name ?? appId}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </VStack>
        {selectedAppId && topUsersForSelectedApp.length > 0 ? (
          <VStack w="full" gap={4}>
            <Heading size="md">
              {t("Users by Rewards for")} {appActions[selectedAppId]?.name}
            </Heading>
            <DrillDownBarChart data={topUsersForSelectedApp} />
          </VStack>
        ) : (
          <Text>{t("Please select an app to view the users.")}</Text>
        )}
      </VStack>
    </VStack>
  )
}
