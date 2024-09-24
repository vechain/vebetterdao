import { useSustainabilityUserOverview } from "@/api"
import { Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const UserSustainabilityOverviewStats = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data, isLoading } = useSustainabilityUserOverview({
    wallet: account ?? undefined,
  })

  //TOOD: Indexer should return aggregated data
  const parsedData = useMemo(() => {
    const defaultData = { totalActions: 0, totalRewards: 0, apps: new Set<string>() }
    const userOverview = data?.pages.map(page => page.data).flat() ?? []
    if (!userOverview) return defaultData

    return userOverview.reduce((acc, curr) => {
      return {
        ...acc,
        totalActions: acc.totalActions + (curr?.actionsRewarded ?? 0),
        totalRewards: acc.totalRewards + (curr?.totalRewardAmount ?? 0),
        totalApps: acc.apps.add(curr?.entity ?? ""),
      }
    }, defaultData)
  }, [data])

  return (
    <HStack gap={8} justify="space-between">
      <VStack align="flex-start" gap={0}>
        <Skeleton isLoaded={!isLoading}>
          <Heading size="lg" fontWeight="400">
            {parsedData.totalActions}
          </Heading>
          <Text fontSize={["xs", "sm"]} fontWeight={500}>
            {t("total actions")}
          </Text>
        </Skeleton>
      </VStack>
      <VStack align="flex-start" gap={0}>
        <Skeleton isLoaded={!isLoading}>
          <Heading size="lg" fontWeight="400">
            {parsedData.totalRewards}
          </Heading>
          <Text fontSize={["xs", "sm"]} fontWeight={500}>
            {t("total b3tr earn")}
          </Text>
        </Skeleton>
      </VStack>
      <VStack align="flex-start" gap={0}>
        <Skeleton isLoaded={!isLoading}>
          <Heading size="lg" fontWeight="400">
            {parsedData.apps.size}
          </Heading>
        </Skeleton>
        <Text fontSize={["xs", "sm"]} fontWeight={500}>
          {t("used apps")}
        </Text>
      </VStack>
    </HStack>
  )
}
