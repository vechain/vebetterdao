import { SustainabilityActionsResponse, useAppsSustainabilityActions } from "@/api"
import { Heading, VStack, HStack, Text, Input, Grid } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { ActionsSharePieChart, TopUsersChart, TotalActionsPerAppChart, UserAppsChart } from "./components"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { subDays } from "date-fns"
import { useTranslation } from "react-i18next"
import Lottie from "react-lottie"
import loadingAnimation from "./components/loading.json"

export const VeBetterPassportData = () => {
  // State variables for the date range
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 1)) // Default to 7 days ago
  const [endDate, setEndDate] = useState<Date>(new Date()) // Default to today

  // Convert dates to UNIX timestamps in seconds
  const startTimestamp = Math.floor(startDate.getTime() / 1000)
  const endTimestamp = Math.floor(endDate.getTime() / 1000)

  const { t } = useTranslation()

  // Fetch data using the selected date range
  const { allActions, actionsByApp, isLoading } = useAppsSustainabilityActions({
    startTimestamp,
    endTimestamp,
  })

  const totalActionsPerApp = useMemo(() => {
    return Object.keys(actionsByApp).map(appId => {
      const actions = actionsByApp[appId]
      return {
        appId,
        name: actions?.name ?? "",
        actions: actions?.actions?.length ?? 0,
        amount: actions?.actions?.reduce((sum, action) => sum + action.amount, 0),
      }
    })
  }, [actionsByApp])

  const actionsByUser = useMemo(() => {
    return allActions.reduce(
      (acc, action) => {
        const { receiver } = action
        if (!acc[receiver]) {
          acc[receiver] = []
        }
        acc[receiver].push(action)
        return acc
      },
      {} as { [receiver: string]: SustainabilityActionsResponse["data"] },
    )
  }, [allActions])

  const totalActionsPerUser = useMemo(() => {
    return Object.keys(actionsByUser).map(userId => {
      const actions = actionsByUser[userId]
      return {
        userId,
        actions: actions?.length ?? 0,
        amount: actions?.reduce((sum, action) => sum + action.amount, 0) ?? 0,
      }
    })
  }, [actionsByUser])

  const topUsers = useMemo(() => {
    return totalActionsPerUser.sort((a, b) => b.actions - a.actions).slice(0, 10)
  }, [totalActionsPerUser])

  const topUsersAppActions = useMemo(() => {
    return topUsers.map(user => {
      const userId = user.userId
      const userActions = actionsByUser[userId] || []

      // Calculate actions per app for this user
      const actionsPerApp = userActions.reduce(
        (acc, action) => {
          const appId = action.appId
          if (!acc[appId]) {
            acc[appId] = { appId, actions: 0 }
          }
          acc[appId].actions += 1
          return acc
        },
        {} as { [appId: string]: { appId: string; actions: number } },
      )

      // Convert to array and sort by actions descending
      const appActionsArray = Object.values(actionsPerApp).sort((a, b) => b.actions - a.actions)

      // Map appId to app name
      const appActionsWithNames = appActionsArray.map(appAction => ({
        ...appAction,
        appName: actionsByApp[appAction.appId]?.name ?? appAction.appId,
      }))

      return {
        userId,
        appActions: appActionsWithNames,
      }
    })
  }, [topUsers, actionsByUser, actionsByApp])

  if (isLoading) {
    return (
      <VStack w={"full"}>
        <Lottie
          style={{
            pointerEvents: "none",
          }}
          options={{
            loop: true,
            autoplay: true,
            animationData: loadingAnimation,
          }}
          height={200}
          width={200}
        />
      </VStack>
    )
  }

  return (
    <VStack w="full" spacing={8} overflow={"clip"}>
      {/* Date Range Pickers */}
      <HStack spacing={4} alignItems="flex-end" w="full" flexDir={{ base: "column", md: "row" }}>
        <VStack alignItems="flex-start" w="full">
          <Text>{t("Start Date:")}</Text>
          <DatePicker
            selected={startDate}
            onChange={date => date && setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            maxDate={endDate}
            customInput={<Input />}
            dateFormat="yyyy-MM-dd"
          />
        </VStack>
        <VStack alignItems="flex-start" w="full">
          <Text>{t("End Date:")}</Text>
          <DatePicker
            selected={endDate}
            onChange={date => date && setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            maxDate={new Date()}
            customInput={<Input />}
            dateFormat="yyyy-MM-dd"
          />
        </VStack>
      </HStack>
      {/* Chart Components */}
      <HStack spacing={4} alignItems="flex-end" w="full" flexDir={{ base: "column", md: "row" }}>
        <VStack w="full" spacing={4}>
          <Heading size="md">{t("Total Actions per App")}</Heading>
          <TotalActionsPerAppChart data={totalActionsPerApp} />
        </VStack>

        <VStack w="full" spacing={4}>
          <Heading size={"md"}>{t("Percentage Share of Actions per App")}</Heading>
          <ActionsSharePieChart data={totalActionsPerApp} />
        </VStack>
      </HStack>

      <VStack w="full" spacing={4}>
        <Heading size="md">{t("Top Users by Actions")}</Heading>
        <TopUsersChart data={topUsers} />
      </VStack>
      <VStack w="full" spacing={4}>
        <Heading size="md">{t("Top Users' Most Used Apps")}</Heading>
        {/* Responsive Grid */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} w="full">
          {topUsersAppActions.map(({ userId, appActions }) => (
            <UserAppsChart key={userId} userId={userId} appActions={appActions} />
          ))}
        </Grid>
      </VStack>
    </VStack>
  )
}
