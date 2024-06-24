import {
  useAllocationVotes,
  useAllocationsRoundState,
  useRoundXApps,
  useXAppMetadata,
  useXAppRoundEarnings,
  useXAppsVotes,
} from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Box, HStack, Heading, Image, Skeleton, Spinner, Stack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { B3TRIcon } from "@/components/Icons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

type Props = {
  roundId: string
}

type AppVotesData = {
  votes: string
  app: string
}

// Maximum precision of 2 decimals. Must also round down
const compactFormatter = getCompactFormatter(2)

export const AllocationXAppsVotesRankingChart = ({ roundId }: Props) => {
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const { data: votes } = useAllocationVotes(roundId)

  const sortedData = useMemo(
    () =>
      xAppsVotes
        .map(app => ({
          votes: app.data?.votes ?? "0",
          app: xApps?.find(xa => xa.id === app.data?.app)?.id ?? "",
        }))
        .sort((a, b) => Number(b.votes) - Number(a.votes)),

    [xAppsVotes, xApps],
  )

  const isLoading = xAppsLoading || xAppsVotes.some(query => query.isLoading)

  if (isLoading) return <Spinner size={"lg"} alignSelf="center" />

  return (
    <VStack spacing={8} align={"flex-start"} w="full">
      {sortedData.map((app, index) => (
        <VotesHorizontalBar key={index} data={app} index={index} totalVotes={votes} roundId={roundId} />
      ))}
    </VStack>
  )
}

export const VotesHorizontalBar = ({
  data,
  index,
  roundId,
  totalVotes,
}: {
  data: AppVotesData
  index: number
  roundId: string
  totalVotes?: string
}) => {
  const { data: appMetadata } = useXAppMetadata(data.app)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const { data: roundState, isLoading: roundStateLoading } = useAllocationsRoundState(roundId)

  const { data: forecastedEarnings, isLoading: forecastedEarningsLoading } = useXAppRoundEarnings(roundId, data.app)

  const votesPercentage = Number(totalVotes) === 0 ? 0 : (Number(data.votes) / Number(totalVotes)) * 100

  const baseProgressColor = "rgba(208, 248, 164, 1)"
  const trackProgressColor = "rgba(154, 222, 78, 1)"

  return (
    <VStack spacing={4} align={"flex-start"} w="full">
      <HStack justify={"space-between"} w="full">
        <HStack spacing={3} align={"center"} justify={"flex-start"}>
          <Skeleton isLoaded={!isLogoLoading} boxSize={[8, 12]}>
            <Image src={logo?.image ?? notFoundImage} w="full" borderRadius="9px" alt={appMetadata?.name} />
          </Skeleton>
          <Heading size={["sm", "md"]} fontWeight={"medium"}>
            {appMetadata?.name}
          </Heading>
        </HStack>
        <HStack spacing={[4, 8]} align={"center"} justify={"flex-start"} alignSelf={"flex-end"}>
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
          <VStack spacing={0} align="flex-end">
            <Stack
              spacing={[0, 0, 1]}
              direction={["column", "column", "row"]}
              align={"flex-end"}
              justify={"flex-end"}
              w="full">
              <Heading
                size={["14px", "16px"]}
                fontWeight={600}
                color="#6DCB09"
                data-testid={appMetadata?.name + "-total-votes"}>
                {compactFormatter.format(Number(data.votes))} Votes
              </Heading>
              <Text fontSize={["10px", "12px"]} fontWeight={400} color="#6DCB09">
                ({votesPercentage.toLocaleString("en", { minimumFractionDigits: 2 })}%)
              </Text>
            </Stack>

            <Skeleton isLoaded={!roundStateLoading} textAlign={"right"}>
              <Text fontSize={["12px", "14px"]} fontWeight={"400"} color="#6A6A6A">
                {"Voted by X users"}
              </Text>
            </Skeleton>
          </VStack>
        </HStack>
      </HStack>
      <Box w="full" h={2} bg={baseProgressColor} borderRadius={"xl"}>
        <Box w={`${votesPercentage}%`} h={2} bg={trackProgressColor} borderRadius={"xl"} />
      </Box>
    </VStack>
  )
}
