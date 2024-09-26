import { useSustainabilityUserOverview } from "@/api"
import { B3TRIcon } from "@/components/Icons"
import { LeafIcon } from "@/components/Icons/LeafIcon"
import { Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"

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
      <VStack align="flex-start" gap={1}>
        <LeafIcon color="#6DCB09" size="1rem" />
        <Skeleton isLoaded={!isLoading}>
          <Heading size="md" fontWeight="700" color="#004CFC">
            {parsedData.totalActions}
          </Heading>
          <Text fontSize={["xs", "sm"]} fontWeight={400} color="#6A6A6A">
            {t("total actions")}
          </Text>
        </Skeleton>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <B3TRIcon w="4" h="4" />
        <Skeleton isLoaded={!isLoading}>
          <Heading size="md" fontWeight="700" color="#004CFC">
            {parsedData.totalRewards}
          </Heading>
          <Text fontSize={["xs", "sm"]} fontWeight={400} color="#6A6A6A">
            {t("total b3tr earn")}
          </Text>
        </Skeleton>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <IoGridOutline color="#6DCB09" size="1rem" />
        <Skeleton isLoaded={!isLoading}>
          <Heading size="md" fontWeight="700" color="#004CFC">
            {parsedData.apps.size}
          </Heading>
        </Skeleton>
        <Text fontSize={["xs", "sm"]} fontWeight={400} color="#6A6A6A">
          {t("used apps")}
        </Text>
      </VStack>
    </HStack>
  )
}
