import {
  useCurrentAllocationsRoundId,
  useSustainabilitySingleUserOverview,
  useSustainabilityUserOverviewPerRound,
} from "@/api"

import { Button, Card, CardBody, Divider, Heading, Skeleton, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"

import { useWallet } from "@vechain/dapp-kit-react"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LeaderboardRankingComponent } from "./LeaderboardRankingComponent"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const { data: roundId, isLoading: roundIdLoading } = useCurrentAllocationsRoundId()

  const userRoundOverview = useSustainabilitySingleUserOverview({ wallet: account ?? "", roundId })

  const yourRaking = useMemo(() => {
    if (!account) return undefined
    if (userRoundOverview.isLoading) return undefined
    if (userRoundOverview.isError) return undefined
    return {
      position: userRoundOverview.data?.rankByActionsRewarded ?? 0,
      address: account ?? "",
      score: userRoundOverview.data?.actionsRewarded ?? 0,
    }
  }, [userRoundOverview, account])

  const leaderboardQuery = useSustainabilityUserOverviewPerRound({ roundId, direction: "desc" })

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

  const onSeeAllClick = () => {
    router.push(`/leaderboard/${roundId}`)
  }

  const renderRankings = useMemo(() => {
    if (leaderboardQuery.isLoading)
      return MockLeaderboard.map(ranking => (
        <Skeleton key={ranking.position} borderRadius={"lg"}>
          <LeaderboardRankingComponent
            ranking={ranking}
            isYourRanking={AddressUtils.compareAddresses(ranking.address, account ?? "")}
          />
        </Skeleton>
      ))

    if (leaderboardQuery.isError || !rankings.length)
      return (
        <VStack spacing={4} align="stretch" w="full" h="full" pos="relative">
          <VStack
            pos={"absolute"}
            backdropFilter="blur(10px)"
            borderRadius="xl"
            top={0}
            left={0}
            w={"full"}
            justify={"center"}
            spacing={1}
            p={4}
            h="full"
            zIndex={2}
            bg="rgba(255, 255, 255, 0.6)">
            <Heading size="sm">{t("Not enough data for the week")}</Heading>
            <Text fontSize="sm" color="#6A6A6A" fontWeight={400} textAlign={"center"}>
              {t("Come back later to see how you are ranking 🥇")}
            </Text>
          </VStack>
          {MockLeaderboard.map(ranking => (
            <LeaderboardRankingComponent
              key={ranking.position}
              ranking={ranking}
              isYourRanking={AddressUtils.compareAddresses(ranking.address, account ?? "")}
            />
          ))}
        </VStack>
      )
    return rankings.map(ranking => (
      <LeaderboardRankingComponent
        ranking={ranking}
        key={ranking.position}
        isYourRanking={AddressUtils.compareAddresses(ranking.address, account ?? "")}
      />
    ))
  }, [leaderboardQuery, account, rankings, t])

  const isRankingInTop5 = rankings.some(ranking => AddressUtils.compareAddresses(ranking.address, account ?? ""))
  return (
    <Card w="full" variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <VStack spacing={2} align="stretch">
            <Skeleton isLoaded={!roundIdLoading}>
              <Heading size="md">
                {t("Round {{id}} leaderboard", {
                  id: roundId ?? "",
                })}
              </Heading>
            </Skeleton>
            <Text fontSize="sm" color="#6A6A6A" fontWeight={400}>
              {t(
                "Ready to save the planet? Do Better Actions in the apps and become the sustainability champion! 🌍✨",
              )}
            </Text>
          </VStack>
          <VStack spacing={4} align="stretch" w="full" h="full">
            {renderRankings}
            {!isRankingInTop5 && (
              <>
                <Divider w="full" h={1} />
                {yourRaking && <LeaderboardRankingComponent ranking={yourRaking} isYourRanking />}
              </>
            )}
          </VStack>
          <Divider w="full" h={1} />
          <Button size="md" variant={"link"} colorScheme="primary" w="full" onClick={onSeeAllClick}>
            {t("See full leaderboard")}
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}
