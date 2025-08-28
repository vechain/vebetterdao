import { useSustainabilitySingleUserOverview } from "@/api"
import { B3TRIcon } from "@/components/Icons"
import { LeafIcon } from "@/components/Icons/LeafIcon"
import { Heading, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(2)

type Props = {
  address: string
}
export const UserSustainabilityOverviewStats = ({ address }: Props) => {
  const { t } = useTranslation()

  const { data, isLoading } = useSustainabilitySingleUserOverview({
    wallet: address ?? undefined,
  })

  //TOOD: Indexer should return aggregated data
  const parsedData = useMemo(() => {
    return {
      totalActions: data?.actionsRewarded ?? 0,
      totalRewards: data?.totalRewardAmount ?? 0,
      apps: data?.uniqueXAppInteractions.length ?? 0,
    }
  }, [data])

  return (
    <HStack gap={8} justify="space-between">
      <VStack align="flex-start" gap={1}>
        <HStack>
          <Icon as={LeafIcon} color="#6DCB09" boxSize={4} />
          <Skeleton loading={isLoading}>
            <Heading size="xl" color="#004CFC">
              {compactFormatter.format(parsedData.totalActions)}
            </Heading>
          </Skeleton>
        </HStack>

        <Text fontSize={["xs", "sm"]} color="#6A6A6A">
          {t("total actions")}
        </Text>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <HStack>
          <B3TRIcon boxSize={4} />
          <Skeleton loading={isLoading}>
            <Heading size="xl" color="#004CFC">
              {compactFormatter.format(parsedData.totalRewards)}
            </Heading>
          </Skeleton>
        </HStack>
        <Text fontSize={["xs", "sm"]} color="#6A6A6A">
          {t("total B3TR earnt")}
        </Text>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <HStack>
          <Icon as={IoGridOutline} color="#6DCB09" boxSize={4} />
          <Skeleton loading={isLoading}>
            <Heading size="xl" color="#004CFC">
              {parsedData.apps}
            </Heading>
          </Skeleton>
        </HStack>
        <Text fontSize={["xs", "sm"]} color="#6A6A6A">
          {t("used apps")}
        </Text>
      </VStack>
    </HStack>
  )
}
