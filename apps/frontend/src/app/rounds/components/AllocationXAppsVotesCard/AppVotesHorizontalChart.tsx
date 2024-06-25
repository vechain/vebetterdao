import { useXAppMetadata, useAllocationsRoundState, useXAppRoundEarnings } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { B3TRIcon } from "@/components"
import { notFoundImage } from "@/constants"
import { VStack, HStack, Skeleton, Heading, Box, Image, Text, Show } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

type AppVotesData = {
  votes: string | number
  app: string
}

type Props = {
  data: AppVotesData
  index: number
  roundId: string
  totalVotes?: string
  showReceived?: boolean
  maxAllocation?: number | string
  renderMaxAllocation?: boolean
}

// Maximum precision of 2 decimals. Must also round down
const compactFormatter = getCompactFormatter(2)

export const AppVotesHorizontalChart = ({
  data,
  index,
  roundId,
  totalVotes,
  showReceived = false,
  maxAllocation,
  renderMaxAllocation = false,
}: Props) => {
  const { t } = useTranslation()
  const { data: appMetadata } = useXAppMetadata(data.app)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const { data: roundState, isLoading: roundStateLoading } = useAllocationsRoundState(roundId)

  const { data: forecastedEarnings, isLoading: forecastedEarningsLoading } = useXAppRoundEarnings(roundId, data.app)

  const votesPercentage = Number(totalVotes) === 0 ? 0 : (Number(data.votes) / Number(totalVotes)) * 100

  const baseProgressColor = "rgba(208, 248, 164, 1)"
  const trackProgressColor = "rgba(154, 222, 78, 1)"

  const showMaxAllocation =
    renderMaxAllocation && maxAllocation && Number(forecastedEarnings?.amount) >= Number(maxAllocation)

  return (
    <VStack spacing={4} align={"flex-start"} w="full">
      <HStack justify={"space-between"} w="full">
        <HStack spacing={3} align={"center"} justify={"flex-start"}>
          <Skeleton isLoaded={!isLogoLoading} boxSize={["24px", "28px", "32px"]}>
            <Image src={logo?.image ?? notFoundImage} w="full" borderRadius="9px" alt={appMetadata?.name} />
          </Skeleton>
          <Heading fontSize={["16px"]} fontWeight={600}>
            {appMetadata?.name}
          </Heading>
        </HStack>
        {showMaxAllocation && (
          <Show above="lg">
            <Box py={"4px"} px="8px" borderRadius={"64px"} bg="#E9FDF1">
              <Text color={"#3DBA67"} fontSize={["12px", "14px"]} fontWeight={600}>
                {t("Max allocation reached!")}
              </Text>
            </Box>
          </Show>
        )}
        <HStack spacing={[4, 8]} align={"center"} justify={"flex-start"} alignSelf={"flex-end"}>
          {showReceived && (
            <VStack spacing={0} align="flex-end">
              <Skeleton isLoaded={!forecastedEarningsLoading}>
                <HStack spacing={1} align={"center"} justify={"flex-start"} w="full">
                  <Heading size={["14px", "16px"]} fontWeight={600} color="#252525">
                    {compactFormatter.format(Number(forecastedEarnings?.amount))}
                  </Heading>
                  <B3TRIcon boxSize={["14px", "16px"]} colorVariant="dark" />
                </HStack>
              </Skeleton>
              <Skeleton isLoaded={!roundStateLoading} textAlign={"right"}>
                <Text fontSize={["12px", "14px"]} fontWeight={"400"} color="#6A6A6A">
                  {roundState === 0 ? "To receive" : "Received"}
                </Text>
              </Skeleton>
            </VStack>
          )}
          <VStack spacing={0} align="flex-end">
            <Heading size={["16px"]} fontWeight={600} color="#6DCB09">
              {t("{{percentage}}%", {
                percentage: votesPercentage.toLocaleString("en", { minimumFractionDigits: 2 }),
              })}
            </Heading>
            <Text fontSize={["12px"]} fontWeight={400} color="#6A6A6A" data-testid={appMetadata?.name + "-total-votes"}>
              {t("{{value}} votes", {
                value: compactFormatter.format(Number(data.votes)),
              })}
            </Text>
          </VStack>
        </HStack>
      </HStack>
      <Box w="full" h={2} bg={baseProgressColor} borderRadius={"xl"}>
        <Box w={`${votesPercentage}%`} h={2} bg={trackProgressColor} borderRadius={"xl"} />
      </Box>
    </VStack>
  )
}
