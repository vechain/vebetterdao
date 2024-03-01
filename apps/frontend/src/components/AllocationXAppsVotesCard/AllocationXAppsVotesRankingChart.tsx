import { useAllocationVotes, useRoundXApps, useXAppMetadata, useXAppRoundEarnings, useXAppsVotes } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { notFoundImage } from "@/constants"
import { Box, HStack, Heading, Image, Skeleton, Text, VStack, useColorModeValue } from "@chakra-ui/react"
import { useMemo } from "react"
import { B3TRIcon } from "../Icons"

type Props = {
  roundId: string
  maxRanks: number
}

type AppVotesData = {
  votes: string
  app: string
}

const enOrdinalRules = new Intl.PluralRules("en-US", { type: "ordinal" })
const suffixMap = {
  one: "st",
  two: "nd",
  few: "rd",
  other: "th",
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const AllocationXAppsVotesRankingChart = ({ roundId, maxRanks }: Props) => {
  const { data: xApps } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const { data: votes, isLoading: votesLoading } = useAllocationVotes(roundId)

  const sortedData = useMemo(
    () =>
      xAppsVotes
        .map(app => ({
          votes: app.data?.votes ?? "0",
          app: xApps?.find(xa => xa.id === app.data?.app)?.id ?? "",
        }))
        .sort((a, b) => Number(b.votes) - Number(a.votes))
        .slice(0, maxRanks),
    [xAppsVotes, xApps, maxRanks],
  )

  return (
    <VStack spacing={8} align={"flex-start"} w="full">
      {sortedData.map((app, index) => (
        <VotesHorizontalBar key={index} data={app} index={index} totalVotes={votes} roundId={roundId} />
      ))}
    </VStack>
  )
}

const VotesHorizontalBar = ({
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
  const { data: appMetadata, error: appMetadatError } = useXAppMetadata(data.app)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const { data: forecastedEarnings, isLoading: forecastedEarningsLoading } = useXAppRoundEarnings(roundId, data.app)

  const indexLabel = index + 1

  const votesPercentage = (Number(data.votes) / Number(totalVotes)) * 100

  const bgShade = useColorModeValue("100", "200")

  const bgColor = `green`

  return (
    <VStack spacing={4} align={"flex-start"} w="full">
      <HStack justify={"space-between"} w="full">
        <HStack spacing={3} align={"center"} justify={"flex-start"} w="full">
          <Skeleton isLoaded={!isLogoLoading} boxSize={12}>
            <Image src={logo?.image ?? notFoundImage} w="full" borderRadius="9px" alt={appMetadata?.name} />
          </Skeleton>
          <Heading size="md" fontWeight={"medium"}>
            {appMetadata?.name}
          </Heading>
        </HStack>
        <HStack spacing={8} align={"center"} justify={"flex-start"} w="full" alignSelf={"flex-end"}>
          <Box>
            <Skeleton isLoaded={!forecastedEarningsLoading}>
              <HStack spacing={1} align={"center"} justify={"flex-start"} w="full">
                <Heading size="md" fontWeight={"medium"}>
                  {compactFormatter.format(Number(forecastedEarnings?.amount))}
                </Heading>
                <B3TRIcon boxSize="20px" />
              </HStack>
            </Skeleton>
            <Text fontSize={"md"} fontWeight={"300"}>
              Real time B3TR distribution
            </Text>
          </Box>
          <VStack spacing={0} align="flex-end">
            <HStack spacing={1} align={"center"} justify={"flex-start"} w="full">
              <Heading size="md" fontWeight={"medium"}>
                {data.votes}
              </Heading>
              <B3TRIcon boxSize="20px" />
            </HStack>

            <Text fontSize={"md"} fontWeight={"300"}>
              Real time votes
            </Text>
          </VStack>
        </HStack>
      </HStack>
      <Box w="full" h={2} bg={`${bgColor}.${bgShade}`} borderRadius={"xl"}>
        <Box w={`${votesPercentage}%`} h={2} bg={`${bgColor}.300`} borderRadius={"xl"} />
      </Box>
    </VStack>
  )
  //   return (
  //     <HStack
  //       py={2}
  //       w={`${votesPercentage}%`}
  //       bg={`${bgColor}.${bgShade}`}
  //       borderRadius={"xl"}
  //       justify="space-between"
  //       align="center">
  //       <Box ml={2}>
  //         <Heading size="md" fontSize={"20px"} color={`${bgColor}.${rankingPositionShade}`}>
  //           {rankingPositionLabel}
  //         </Heading>
  //         <VStack spacing={0} align={"flex-start"} justify={"flex-end"} w="full">
  //           <Heading size="xl" color={`${bgColor}.${votesCountShade}`} lineHeight={"100%"}>
  //             {compactFormatter.format(Number(data.votes))}
  //           </Heading>
  //           <HStack spacing={2} align={"center"} justify={"flex-start"} w="full">
  //             <Skeleton isLoaded={!isLogoLoading} boxSize={6}>
  //               <Image src={logo?.image ?? notFoundImage} w="full" borderRadius="9px" alt={appMetadata?.name} />
  //             </Skeleton>
  //             <Heading size="md" color={`${bgColor}.${nameShade}`} fontWeight={"medium"}>
  //               {appMetadata?.name}
  //             </Heading>
  //           </HStack>
  //         </VStack>
  //       </Box>
  //     </HStack>
  //   )
}
