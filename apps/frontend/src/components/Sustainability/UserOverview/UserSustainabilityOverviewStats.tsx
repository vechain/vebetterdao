import { useSustainabilitySingleUserOverview } from "@/api"
import { B3TRIcon } from "@/components/Icons"
import { LeafIcon } from "@/components/Icons/LeafIcon"
import { Heading, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"

export const UserSustainabilityOverviewStats = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { data, isLoading } = useSustainabilitySingleUserOverview({
    wallet: account ?? undefined,
  })

  //TOOD: Indexer should return aggregated data
  const parsedData = useMemo(() => {
    return {
      totalActions: data?.actionsRewarded ?? 0,
      totalRewards: data?.totalRewardAmount ?? 0,
      apps: [],
    }
  }, [data])

  return (
    <HStack gap={8} justify="space-between">
      <VStack align="flex-start" gap={1}>
        <HStack>
          <Icon as={LeafIcon} color="#6DCB09" boxSize={4} />
          <Skeleton isLoaded={!isLoading}>
            <Heading size="md" fontWeight="700" color="#004CFC">
              {parsedData.totalActions}
            </Heading>
          </Skeleton>
        </HStack>

        <Text fontSize={["xs", "sm"]} fontWeight={400} color="#6A6A6A">
          {t("total actions")}
        </Text>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <HStack>
          <B3TRIcon boxSize={4} />
          <Skeleton isLoaded={!isLoading}>
            <Heading size="md" fontWeight="700" color="#004CFC">
              {parsedData.totalRewards}
            </Heading>
          </Skeleton>
        </HStack>
        <Text fontSize={["xs", "sm"]} fontWeight={400} color="#6A6A6A">
          {t("total B3TR earnt")}
        </Text>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <HStack>
          <Icon as={IoGridOutline} color="#6DCB09" boxSize={4} />
          <Skeleton isLoaded={!isLoading}>
            <Heading size="md" fontWeight="700" color="#004CFC">
              {parsedData.apps.length}
            </Heading>
          </Skeleton>
        </HStack>
        <Text fontSize={["xs", "sm"]} fontWeight={400} color="#6A6A6A">
          {t("used apps")}
        </Text>
      </VStack>
    </HStack>
  )
}
