import { Card, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

import { useNavigatorOverview } from "@/api/indexer/navigators/useNavigators"

const formatter = getCompactFormatter(2)

export const NavigatorOverviewCard = () => {
  const { data: overview, isLoading: overviewLoading } = useNavigatorOverview()

  return (
    <Card.Root variant="outline" borderRadius="xl">
      <Card.Body>
        <VStack gap={3} align="start">
          <Heading size="sm">{"Overview"}</Heading>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Active Navigators"}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview?.activeNavigators ?? 0}
              </Text>
            </Skeleton>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Total Staked"}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview ? formatter.format(Number(overview.totalStakedFormatted)) : "0"}
                {" B3TR"}
              </Text>
            </Skeleton>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Total Citizens"}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview?.totalCitizens ?? 0}
              </Text>
            </Skeleton>
          </HStack>
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="fg.muted">
              {"Total Delegated"}
            </Text>
            <Skeleton loading={overviewLoading}>
              <Text textStyle="sm" fontWeight="semibold">
                {overview ? formatter.format(Number(overview.totalDelegatedFormatted)) : "0"}
                {" VOT3"}
              </Text>
            </Skeleton>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
