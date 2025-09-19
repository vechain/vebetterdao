import { useUserActionOverview } from "@/api"
import { Heading, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"

import { TbLeaf } from "react-icons/tb"
import B3TRIcon from "@/components/Icons/svg/b3tr.svg"

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(2)

type Props = {
  address: string
}
export const UserSustainabilityOverviewStats = ({ address }: Props) => {
  const { t } = useTranslation()

  const { data, isLoading } = useUserActionOverview(address ?? "")

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
          <Icon as={TbLeaf} color="brand.secondary" boxSize={4} />
          <Skeleton loading={isLoading}>
            <Heading size="xl">{compactFormatter.format(parsedData.totalActions)}</Heading>
          </Skeleton>
        </HStack>

        <Text textStyle={["xs", "sm"]} color="text.subtle">
          {t("total actions")}
        </Text>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <HStack>
          <Icon as={B3TRIcon} boxSize={6} color="brand.secondary" />
          <Skeleton loading={isLoading}>
            <Heading size="xl">{compactFormatter.format(parsedData.totalRewards)}</Heading>
          </Skeleton>
        </HStack>
        <Text textStyle={["xs", "sm"]} color="text.subtle">
          {t("total B3TR earnt")}
        </Text>
      </VStack>
      <VStack align="flex-start" gap={1}>
        <HStack>
          <Icon as={IoGridOutline} color="brand.secondary" boxSize={4} />
          <Skeleton loading={isLoading}>
            <Heading size="xl">{parsedData.apps}</Heading>
          </Skeleton>
        </HStack>
        <Text textStyle={["xs", "sm"]} color="text.subtle">
          {t("used apps")}
        </Text>
      </VStack>
    </HStack>
  )
}
