import { Card, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

import { useNavigatorOverview } from "@/api/indexer/navigators/useNavigators"

const formatter = getCompactFormatter(2)

export const NavigatorOverviewCard = () => {
  const { t } = useTranslation()
  const { data: overview, isLoading: overviewLoading } = useNavigatorOverview()

  return (
    <Card.Root variant="outline" borderRadius="xl">
      <Card.Body>
        <VStack gap={3} align="start">
          <Heading size="sm">{t("Overview")}</Heading>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Active Navigators")}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview?.activeNavigators ?? 0}
              </Text>
            </Skeleton>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Total Staked")}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview ? formatter.format(Number(overview.totalStakedFormatted)) : "0"} {t("B3TR")}
              </Text>
            </Skeleton>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Total Citizens")}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview?.totalCitizens ?? 0}
              </Text>
            </Skeleton>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {t("Total Delegated")}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview ? formatter.format(Number(overview.totalDelegatedFormatted)) : "0"} {t("VOT3")}
              </Text>
            </Skeleton>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
