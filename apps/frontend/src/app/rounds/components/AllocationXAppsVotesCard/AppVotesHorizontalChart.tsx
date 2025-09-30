import { useRoundAppVotes, useXAppMetadata, useXAppRoundEarnings } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { B3TRIcon } from "@/components"
import { notFoundImage } from "@/constants"
import { VStack, HStack, Skeleton, Heading, Box, Image, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

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
  const router = useRouter()
  const { t } = useTranslation()
  const { data: appMetadata } = useXAppMetadata(data.app)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const { data: forecastedEarnings, isLoading: forecastedEarningsLoading } = useXAppRoundEarnings(roundId, data.app)

  const onIconClick = () => {
    router.push(`/apps/${data.app}`)
  }
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

  const baseProgressColor = "rgba(208, 248, 164, 1)"
  const trackProgressColor = "rgba(154, 222, 78, 1)"

  const showMaxAllocation =
    renderMaxAllocation && maxAllocation && Number(forecastedEarnings?.amount) >= Number(maxAllocation)

  return (
    <VStack gap={4} align={"flex-start"} w="full">
      <HStack justify={"space-between"} w="full" align="center">
        <HStack gap={3} align={"center"} justify={"flex-start"}>
          <VStack gap={0} align={"flex-start"}>
            <Skeleton loading={isLogoLoading} boxSize={["48px", "48px", "48px"]}>
              <Image
                _hover={{ cursor: "pointer", transform: "scale(1.05)", transition: "transform 0.2s" }}
                onClick={onIconClick}
                src={logo?.image ?? notFoundImage}
                w="full"
                borderRadius="9px"
                alt={appMetadata?.name}
              />
            </Skeleton>
          </VStack>
          <VStack gap={0} align={"flex-start"}>
            <Heading fontSize={["16px"]} fontWeight={600}>
              {appMetadata?.name}
            </Heading>
            <VStack gap={0} align={"flex-start"} justify={"flex-start"}>
              <Heading
                fontSize={["16px"]}
                fontWeight={600}
                color="#6DCB09"
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
                  <Heading fontSize={["14px", "16px"]} fontWeight={600}>
                    {compactFormatter.format(Number(forecastedEarnings?.amount))}
                  </Heading>
                  <B3TRIcon boxSize={["14px", "16px"]} colorVariant="dark" />
                </HStack>
              </Skeleton>
              <Skeleton loading={appVotes === undefined} textAlign={"right"}>
                <Text fontSize={["12px", "14px"]} fontWeight={"400"} color="#6A6A6A">
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
          <Text color={"#3DBA67"} fontSize={["12px", "14px"]} fontWeight={600} alignSelf={"flex-end"}>
            {t("Max allocation reached!")}
          </Text>
        )}
      </VStack>
    </VStack>
  )
}
