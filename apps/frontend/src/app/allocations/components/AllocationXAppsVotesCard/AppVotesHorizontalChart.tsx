import { VStack, HStack, Skeleton, Heading, Box, Image, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useTotalXAppEarnings } from "../../../../api/contracts/dbaPool/hooks/useTotalXAppEarnings"
import { useXAppMetadata } from "../../../../api/contracts/xApps/hooks/useXAppMetadata"
import { useRoundAppVotes } from "../../../../api/indexer/xallocations/useAppVotesRound"
import { useIpfsImage } from "../../../../api/ipfs/hooks/useIpfsImage"
import { B3TRIcon } from "../../../../components/Icons/B3TRIcon"

const notFoundImage = "/assets/images/image-not-found.webp"

type AppVotesData = {
  percentage: number
  app: string
}

type Props = {
  data: AppVotesData
  roundId: string
  totalVotes?: string
  showReceived?: boolean
  maxAllocation?: number | string
  maxAllocationPercentage?: number
  renderMaxAllocation?: boolean
  showTotalVoters?: boolean
}

// Maximum precision of 2 decimals. Must also round down
const compactFormatter = getCompactFormatter(2)

export const AppVotesHorizontalChart = ({
  data,
  roundId,
  showReceived = false,
  maxAllocation,
  maxAllocationPercentage,
  renderMaxAllocation = false,
}: //   showTotalVoters = false,
Props) => {
  const { t } = useTranslation()
  const { data: appMetadata } = useXAppMetadata(data.app)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  // Use combined earnings hook that includes DBA rewards
  const { data: totalEarnings, isLoading: forecastedEarningsLoading } = useTotalXAppEarnings(
    roundId,
    data.app,
    data.percentage,
  )

  const roundIdNumber = useMemo(() => {
    try {
      return Number(roundId)
    } catch {
      return 0
    }
  }, [roundId])

  const { data: roundAppVotes } = useRoundAppVotes(roundIdNumber)

  const appVotes = useMemo(() => {
    const appVoteResult = roundAppVotes?.filter(vote => vote.appId === data.app) ?? []

    if (appVoteResult.length !== 1) return 0

    return appVoteResult?.[0]?.voters
  }, [roundAppVotes, data.app])

  // TODO: color mode
  const baseProgressColor = "rgba(208, 248, 164, 1)"
  const trackProgressColor = "rgba(154, 222, 78, 1)"

  const showMaxAllocation =
    renderMaxAllocation && maxAllocation && Number(totalEarnings?.baseEarnings) >= Number(maxAllocation)

  return (
    <VStack gap={4} align={"flex-start"} w="full">
      <HStack justify={"space-between"} w="full" align="center">
        <HStack gap={3} align={"center"} justify={"flex-start"}>
          <VStack gap={0} align={"flex-start"}>
            <Skeleton loading={isLogoLoading} boxSize={["48px", "48px", "48px"]}>
              <NextLink href={`/apps/${data.app}`}>
                <Image
                  _hover={{ cursor: "pointer", transform: "scale(1.05)", transition: "transform 0.2s" }}
                  src={logo?.image ?? notFoundImage}
                  w="full"
                  borderRadius="9px"
                  alt={appMetadata?.name}
                />
              </NextLink>
            </Skeleton>
          </VStack>
          <VStack gap={0} align={"flex-start"}>
            <Heading size="md" fontWeight="semibold">
              {appMetadata?.name}
            </Heading>
            <VStack gap={0} align={"flex-start"} justify={"flex-start"}>
              <Heading
                size="md"
                fontWeight="semibold"
                color="status.positive.primary"
                data-testid={`${appMetadata?.name}-votes-percentage`}>
                {t("{{percentage}}%", {
                  percentage: data.percentage.toLocaleString("en", { minimumFractionDigits: 2 }),
                })}
              </Heading>
            </VStack>
          </VStack>
        </HStack>

        <HStack gap={[4, 8]} align={"center"} justify={"flex-start"}>
          {showReceived && (
            <VStack gap={0} align={["flex-end"]}>
              <Skeleton loading={forecastedEarningsLoading}>
                <HStack gap={1} align={"center"} justify={"flex-start"} w="full">
                  <Heading size={["sm", "md"]} fontWeight="semibold">
                    {compactFormatter.format(Number(totalEarnings?.totalEarnings))}
                  </Heading>
                  <B3TRIcon boxSize={["14px", "16px"]} colorVariant="dark" />
                </HStack>
              </Skeleton>
              <Skeleton loading={appVotes === undefined} textAlign={"right"}>
                <Text textStyle={["xs", "sm"]} color="text.subtle">
                  {t("voted by")}{" "}
                  <span style={{ fontWeight: 600 }}>
                    {appVotes} {t("wallets")}
                  </span>
                </Text>
              </Skeleton>
            </VStack>
          )}
        </HStack>
      </HStack>
      <VStack gap={1} w="full">
        <Box w="full" h={2} bg={baseProgressColor} borderRadius={"xl"} pos="relative">
          <Box pos="absolute" w={`${data.percentage}%`} h={2} bg={trackProgressColor} borderRadius={"xl"} />
          <Box
            pos="absolute"
            left={`${maxAllocationPercentage}%`}
            top={0}
            h="full"
            w="1px"
            bg={showMaxAllocation ? baseProgressColor : trackProgressColor}
            borderRadius={"xl"}
          />
        </Box>
        {showMaxAllocation && (
          <Text color={"status.positive.primary"} textStyle={["xs", "sm"]} fontWeight="semibold" alignSelf={"flex-end"}>
            {t("Max allocation reached!")}
          </Text>
        )}
      </VStack>
    </VStack>
  )
}
