import {
  useCurrentAllocationsRoundId,
  useSustainabilitySingleUserOverview,
  useSustainabilityUserOverviewPerRound,
} from "@/api"
import NextLink from "next/link"

import { Card, Separator, Heading, HStack, Icon, IconButton, Skeleton, Text, VStack, Link } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"

import { useWallet } from "@vechain/vechain-kit"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LeaderboardRankingComponent } from "./LeaderboardRankingComponent"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"

export const MockLeaderboard = [
  { position: 1, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 100 },
  { position: 2, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 90 },
  { position: 3, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 80 },
  { position: 4, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 70 },
  { position: 5, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 60 },
]

export const Leaderboard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: roundId, isLoading: roundIdLoading } = useCurrentAllocationsRoundId()

  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>()

  const isLastRound = selectedRoundId === roundId
  const isFirstRound = selectedRoundId === "1"

  useEffect(() => {
    if (roundId && !selectedRoundId) {
      setSelectedRoundId(roundId)
    }
  }, [roundId, selectedRoundId])

  const userRoundOverview = useSustainabilitySingleUserOverview({
    wallet: account?.address ?? "",
    roundId: selectedRoundId,
  })

  const onRoundChange = (roundId: string) => () => {
    setSelectedRoundId(roundId)
  }

  const yourRaking = useMemo(() => {
    if (!account?.address) return undefined
    if (userRoundOverview.isLoading) return undefined
    if (userRoundOverview.isError) {
      console.error(userRoundOverview.error)
      return undefined
    }
    return {
      position: userRoundOverview.data?.rankByActionsRewarded ?? 0,
      address: account?.address ?? "",
      score: userRoundOverview.data?.actionsRewarded ?? 0,
    }
  }, [userRoundOverview, account?.address])

  const leaderboardQuery = useSustainabilityUserOverviewPerRound({ roundId: selectedRoundId, direction: "desc" })

  const flatLeaderboard = useMemo(
    () =>
      leaderboardQuery.data?.pages
        .map(page => page.data)
        .flat()
        .slice(0, 5) ?? [],
    [leaderboardQuery.data],
  )
  const rankings = flatLeaderboard.map((entry, index) => ({
    position: index + 1,
    address: entry?.entity as string,
    score: entry?.actionsRewarded as number,
  }))

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

    if (leaderboardQuery.isError || !rankings.length)
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
            <Heading size="sm">{t("Not enough data for the week")}</Heading>
            <Text fontSize="sm" color="#6A6A6A" fontWeight={400} textAlign={"center"}>
              {t("Leaderboard is available since the integration of sustainability proofs 🥇")}
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
    return rankings.map(ranking => (
      <LeaderboardRankingComponent
        ranking={ranking}
        key={ranking.position}
        isYourRanking={AddressUtils.compareAddresses(ranking.address, account?.address ?? "")}
      />
    ))
  }, [leaderboardQuery, account, rankings, t])

  const isRankingInTop5 = rankings.some(ranking =>
    AddressUtils.compareAddresses(ranking.address, account?.address ?? ""),
  )
  return (
    <Card.Root w="full" variant={"baseWithBorder"}>
      <Card.Body>
        <VStack gap={6} align="stretch" h="full">
          <VStack gap={2} align="stretch">
            <HStack justify={"space-between"} w="full">
              <IconButton
                minW={0}
                size={"lg"}
                aria-label="Next round"
                variant="ghost"
                colorPalette="primary"
                disabled={isFirstRound}
                onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}>
                <Icon as={FaAngleLeft} boxSize={5} />
              </IconButton>
              <Skeleton loading={roundIdLoading}>
                <Heading size={["sm", "sm", "md"]}>
                  {t("Round {{id}} leaderboard", {
                    id: selectedRoundId ?? "",
                  })}
                </Heading>
              </Skeleton>
              <IconButton
                minW={0}
                size={"lg"}
                aria-label="Next round"
                variant="ghost"
                colorPalette="primary"
                disabled={isLastRound}
                onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}>
                <Icon as={FaAngleRight} boxSize={5} />
              </IconButton>
            </HStack>
            <Text fontSize="sm" color="#6A6A6A" fontWeight={400}>
              {t(
                "Ready to save the planet? Do Better Actions in the apps and become the sustainability champion! 🌍✨",
              )}
            </Text>
          </VStack>
          <VStack gap={4} align="stretch" w="full" h="full">
            {renderRankings}
            {!isRankingInTop5 && (
              <>
                <Separator w="full" h={1} />
                {yourRaking && <LeaderboardRankingComponent ranking={yourRaking} isYourRanking />}
              </>
            )}
          </VStack>
          <Separator w="full" h={1} />
          <Link asChild variant={"plain"} color="primary" mx="auto">
            <NextLink href={`/leaderboard/${selectedRoundId}`}>{t("See full leaderboard")}</NextLink>
          </Link>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
