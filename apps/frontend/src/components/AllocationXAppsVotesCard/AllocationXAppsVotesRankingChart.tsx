import { useAllocationVotes, useRoundXApps, useXAppMetadata, useXAppsVotes } from "@/api"
import { useIpfsImage } from "@/api/ipfs"
import { Box, HStack, Heading, Image, Skeleton, VStack, useColorModeValue } from "@chakra-ui/react"
import { useMemo } from "react"

type Props = {
  roundId: string
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

const notFoundImage = "/images/image-not-found.png"

export const AllocationXAppsVotesRankingChart = ({ roundId }: Props) => {
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
        .sort((a, b) => Number(b.votes) - Number(a.votes)),
    [xAppsVotes, xApps],
  )

  return (
    <VStack spacing={8} align={"flex-start"} w="full">
      {sortedData.map((app, index) => (
        <VotesHorizontalBar key={index} data={app} index={index} totalVotes={votes} />
      ))}
    </VStack>
  )
}

const VotesHorizontalBar = ({
  data,
  index,
  totalVotes,
}: {
  data: AppVotesData
  index: number
  totalVotes?: string
}) => {
  const { data: appMetadata, error: appMetadatError } = useXAppMetadata(data.app)
  const { data: logo, isLoading: isLogoLoading } = useIpfsImage(appMetadata?.logo)

  const indexLabel = index + 1
  const rankingPositionLabel = indexLabel + suffixMap[enOrdinalRules.select(indexLabel) as keyof typeof suffixMap]
  const votesPercentage = (Number(data.votes) / Number(totalVotes)) * 100

  const bgShade = useColorModeValue("100", "200")
  const rankingPositionShade = useColorModeValue("200", "300")
  const nameShade = useColorModeValue("500", "600")
  const votesCountShade = useColorModeValue("600", "700")

  const bgColor = `green`

  return (
    <HStack align="stretch" w="full">
      <HStack
        w={`${votesPercentage}%`}
        bg={`${bgColor}.${bgShade}`}
        borderRadius={"xl"}
        justify="space-between"
        align="center">
        <Heading size="4xl" fontSize={"80px"} color={`${bgColor}.${rankingPositionShade}`}>
          {rankingPositionLabel}
        </Heading>

        <VStack spacing={0} align={"flex-start"} justify={"space-between"} mr={4}>
          <Heading size="xl" color={`${bgColor}.${votesCountShade}`} lineHeight={"100%"}>
            {compactFormatter.format(Number(data.votes))}
          </Heading>
          <HStack spacing={2} align={"center"}>
            <Heading size="xs" color={`${bgColor}.${nameShade}`} fontWeight={"medium"}>
              {appMetadata?.name}
            </Heading>
          </HStack>
        </VStack>
      </HStack>

      <Skeleton isLoaded={!isLogoLoading} maxW={20}>
        <Image
          src={logo?.image ?? notFoundImage}
          alt={appMetadata?.name}
          w="full"
          h="full"
          borderRadius="lg"
          objectFit={"cover"}
        />
      </Skeleton>
    </HStack>
  )
}
