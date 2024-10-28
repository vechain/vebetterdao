import { useAppsSustainabilityActions, useCurrentAllocationsRoundId, AppUsersData } from "@/api"
import { Heading, VStack, HStack, Text, Select, CircularProgress, CircularProgressLabel, Grid } from "@chakra-ui/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ActionsSharePieChart, TopUsersChart, TotalActionsPerAppChart, UserAppsChart } from "./components"
import { useTranslation } from "react-i18next"

export const VeBetterPassportData = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  // State variables for round range
  const [startRound, setStartRound] = useState<number>(0)
  const [endRound, setEndRound] = useState<number>(0)
  const [roundOptions, setRoundOptions] = useState<number[]>([])

  useEffect(() => {
    if (currentRoundId) {
      const rounds = Array.from({ length: 20 }, (_, i) => Number(currentRoundId) - i) // Show up to 20 rounds back
      setRoundOptions(rounds)
      setStartRound(rounds?.[7] ?? 0) // Default to 7 rounds back
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
  }, [topUsers, appActions])

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
      <VStack w="full" spacing={8} mt={10}>
        <CircularProgress
          value={progressPercent}
          size="120px"
          thickness="8px"
          color="teal.400"
          trackColor="gray.200"
          capIsRound>
          <CircularProgressLabel>
            {progressPercent}
            {"%"}
          </CircularProgressLabel>
        </CircularProgress>
        <Text fontSize="lg" color="gray.600">
          {t("Fetching data...")}
        </Text>
      </VStack>
    )
  }

  return (
    <VStack w="full" spacing={8} overflow={"clip"}>
      {/* Round Range Dropdowns */}
      <HStack spacing={4} alignItems="flex-end" w="full" flexDir={{ base: "column", md: "row" }}>
        <VStack alignItems="flex-start" w="full">
          <Text>{t("Start Round:")}</Text>
          <Select value={startRound} onChange={onStartRoundChange} placeholder={t("Select start round")}>
            {startRoundOptions.map(round => (
              <option key={round} value={round}>
                {t("Round")} {round}
              </option>
            ))}
          </Select>
        </VStack>
        <VStack alignItems="flex-start" w="full">
          <Text>{t("End Round:")}</Text>
          <Select value={endRound} onChange={onEndRoundChange} placeholder={t("Select end round")}>
            {endRoundOptions.map(round => (
              <option key={round} value={round}>
                {t("Round")} {round}
              </option>
            ))}
          </Select>
        </VStack>
      </HStack>

      {/* Chart Components */}
      <HStack spacing={4} alignItems="flex-end" w="full" flexDir={{ base: "column", md: "row" }}>
        <VStack w="full" spacing={4}>
          <Heading size="md">{t("Total Actions per App")}</Heading>
          <TotalActionsPerAppChart data={totalActionsPerApp} />
        </VStack>
        <VStack w="full" spacing={4}>
          <Heading size="md">{t("Percentage Share of Actions per App")}</Heading>
          <ActionsSharePieChart data={totalActionsPerApp} />
        </VStack>
      </HStack>

      {/* Additional Components for Users if needed */}
      <VStack w="full" spacing={4}>
        <Heading size="md">{t("Top Users by Actions")}</Heading>
        <TopUsersChart data={topUsers} />
      </VStack>
      <VStack w="full" spacing={4}>
        <Heading size="md">{t("Top Users' Most Used Apps")}</Heading>
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} w="full">
          {topUsersAppActions.map(({ userId, appActions }) => (
            <UserAppsChart key={userId} userId={userId} appActions={appActions} />
          ))}
        </Grid>
      </VStack>
    </VStack>
  )
}
