import { Button, Center, Heading, HStack, Icon, IconButton, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { t } from "i18next"
import NextLink from "next/link"
import { useEffect, useMemo, useState } from "react"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"
import InfiniteScroll from "react-infinite-scroll-component"

import { useCurrentAllocationsRoundId } from "../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useUserActionLeaderboard } from "../../api/indexer/actions/useUserActionLeaderboard"
import { useUserActionOverview } from "../../api/indexer/actions/useUserActionOverview"
import { MockLeaderboard } from "../../components/Leaderboard/Leaderboard"
import { LeaderboardRankingComponent } from "../../components/Leaderboard/LeaderboardRankingComponent"

type Props = { roundId: string }
export const LeaderboardPageContent = ({ roundId }: Props) => {
  const { account } = useWallet()
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
  const userRoundOverview = useUserActionOverview(account?.address ?? "", {
    roundId: selectedRoundId ? Number(selectedRoundId) : undefined,
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

  const leaderboardQuery = useUserActionLeaderboard({
    roundId: selectedRoundId ? Number(selectedRoundId) : undefined,
    direction: "DESC",
  })

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
            <Text textStyle="sm" color="text.subtle" textAlign={"center"}>
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
                address: ranking?.wallet ?? "",
                score: ranking?.actionsRewarded ?? 0,
              }}
              key={`leaderboard-${ranking?.wallet ?? idx}-${ranking?.roundId ?? idx}`}
              isYourRanking={AddressUtils.compareAddresses(ranking?.wallet ?? "", account?.address ?? "")}
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
          bg="bg.primary"
          p={4}
          zIndex={2}
          left={0}
          right={0}
          borderTopWidth={1}
          borderColor="border.secondary">
          <VStack w="full" maxW={"breakpoint-md"} mx="auto" align="stretch">
            <LeaderboardRankingComponent ranking={yourRaking} isYourRanking={true} />
          </VStack>
        </VStack>
      )}
      <VStack gap={8} align="flex-start" w="full">
        <Button px={0} variant="plain" color="actions.tertiary.default" size="sm" asChild>
          <NextLink href="/">
            <FaAngleLeft />
            {t("Go back")}
          </NextLink>
        </Button>
        <HStack justify={"space-between"} w="full">
          <IconButton
            minW={0}
            size={"lg"}
            aria-label="Next round"
            variant="plain"
            color="actions.tertiary.default"
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
            color="actions.tertiary.default"
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
