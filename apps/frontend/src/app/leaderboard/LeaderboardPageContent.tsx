import {
  useCurrentAllocationsRoundId,
  useSustainabilitySingleUserOverview,
  useSustainabilityUserOverviewPerRound,
} from "@/api"
import { LeaderboardRankingComponent, MockLeaderboard } from "@/components/Leaderboard"
import { Button, Center, Heading, HStack, Icon, IconButton, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { t } from "i18next"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"
import InfiniteScroll from "react-infinite-scroll-component"

type Props = { roundId: string }
export const LeaderboardPageContent = ({ roundId }: Props) => {
  const { account } = useWallet()
  const router = useRouter()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>()

  const isLastRound = selectedRoundId === currentRoundId
  const isFirstRound = selectedRoundId === "1"

  useEffect(() => {
    if (roundId && !selectedRoundId) {
      setSelectedRoundId(roundId)
    }
  }, [roundId, selectedRoundId])

  const onRoundChange = (roundId: string) => () => {
    setSelectedRoundId(roundId)
  }

  const userRoundOverview = useSustainabilitySingleUserOverview({
    wallet: account?.address ?? "",
    roundId: selectedRoundId,
  })

  const yourRaking = useMemo(() => {
    if (!account?.address) return undefined
    if (userRoundOverview.isLoading) return undefined
    if (userRoundOverview.isError) return undefined
    return {
      position: userRoundOverview.data?.rankByActionsRewarded ?? 0,
      address: account?.address ?? "",
      score: userRoundOverview.data?.actionsRewarded ?? 0,
    }
  }, [userRoundOverview, account?.address])

  const leaderboardQuery = useSustainabilityUserOverviewPerRound({ roundId: selectedRoundId, direction: "desc" })

  const visibleRankings = useMemo(
    () => leaderboardQuery.data?.pages.map(page => page.data).flat() ?? [],
    [leaderboardQuery.data],
  )

  const renderRankings = useMemo(() => {
    if (leaderboardQuery.isLoading)
      return MockLeaderboard.map(ranking => (
        <Skeleton key={ranking.position} borderRadius={"lg"}>
          <LeaderboardRankingComponent
            ranking={ranking}
            isYourRanking={AddressUtils.compareAddresses(ranking.address, account?.address ?? "")}
          />
        </Skeleton>
      ))

    if (leaderboardQuery.isError || !visibleRankings.length)
      return (
        <VStack gap={4} align="stretch" w="full" h="full" pos="relative">
          <VStack
            pos={"absolute"}
            backdropFilter="blur(10px)"
            borderRadius="xl"
            top={0}
            left={0}
            w={"full"}
            justify={"center"}
            gap={1}
            p={4}
            h="full"
            zIndex={2}
            bg="rgba(255, 255, 255, 0.6)">
            <Heading size="md">{t("Not enough data for the week")}</Heading>
            <Text textStyle="sm" color="#6A6A6A" fontWeight={400} textAlign={"center"}>
              {t("Come back later to see how you are ranking 🥇")}
            </Text>
          </VStack>
          {MockLeaderboard.map(ranking => (
            <LeaderboardRankingComponent
              key={ranking.position}
              ranking={ranking}
              isYourRanking={AddressUtils.compareAddresses(ranking.address, account?.address ?? "")}
            />
          ))}
        </VStack>
      )
    return (
      <InfiniteScroll
        dataLength={visibleRankings.length}
        next={leaderboardQuery.fetchNextPage}
        hasMore={leaderboardQuery.hasNextPage}
        loader={
          <Center>
            <Spinner size="md" mt={4} alignSelf="center" />
          </Center>
        }
        endMessage={
          <Heading size="md" textAlign={"center"} mt={4}>
            {t("You reached the end!")}
          </Heading>
        }
        style={{ overflow: "hidden", width: "100%" }}>
        <VStack alignItems="stretch" w="full">
          {visibleRankings.map((ranking, idx) => (
            <LeaderboardRankingComponent
              ranking={{
                position: idx + 1,
                address: ranking?.entity ?? "",
                score: ranking?.actionsRewarded ?? 0,
              }}
              key={`leaderboard-${ranking?.entity ?? idx}-${ranking?.roundId ?? idx}`}
              isYourRanking={AddressUtils.compareAddresses(ranking?.entity ?? "", account?.address ?? "")}
            />
          ))}
        </VStack>
      </InfiniteScroll>
    )
  }, [leaderboardQuery, account, visibleRankings])

  return (
    <VStack gap={8} data-testid="leaderboard-page" maxW="breakpoint-md" mx="auto" align="stretch" w="full">
      {yourRaking && (
        <VStack
          pos="fixed"
          bottom={0}
          w="full"
          bg="white"
          boxShadow="0px -1px 9px 0px rgba(0, 0, 0, 0.08);"
          p={4}
          zIndex={2}
          left={0}
          right={0}
          borderTopWidth={1}
          borderColor="gray.200">
          <VStack w="full" maxW={"breakpoint-md"} mx="auto" align="stretch">
            <LeaderboardRankingComponent ranking={yourRaking} isYourRanking={true} />
          </VStack>
        </VStack>
      )}
      <VStack gap={8} align="flex-start" w="full">
        <Button
          px={0}
          variant="plain"
          color="primary"
          _hover={{
            textDecoration: "underline",
          }}
          size="sm"
          onClick={() => router.push("/")}>
          <FaAngleLeft />
          {t("Go back")}
        </Button>
        <HStack justify={"space-between"} w="full">
          <IconButton
            minW={0}
            size={"lg"}
            aria-label="Next round"
            variant="plain"
            color="primary"
            disabled={isFirstRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}>
            <Icon as={FaAngleLeft} boxSize={5} />
          </IconButton>

          <Heading size={{ base: "md", lg: "xl" }}>
            {t("Round {{id}} leaderboard", {
              id: selectedRoundId ?? "",
            })}
          </Heading>

          <IconButton
            minW={0}
            size={"lg"}
            aria-label="Next round"
            variant="plain"
            color="primary"
            disabled={isLastRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}>
            <Icon as={FaAngleRight} boxSize={5} />
          </IconButton>
        </HStack>
      </VStack>
      {renderRankings}
    </VStack>
  )
}
