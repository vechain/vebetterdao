import {
  useCurrentAllocationsRoundId,
  useSustainabilitySingleUserOverview,
  useSustainabilityUserOverviewPerRound,
} from "@/api"
import { AddressButton } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import { Box, Card, CardBody, Divider, Heading, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useWallet, useVechainDomain } from "@vechain/dapp-kit-react"
import { t } from "i18next"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"

type LeaderboardRanking = {
  position: number
  address: string
  score: number
}

const MockLeaderboard = [
  { position: 1, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 100 },
  { position: 2, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 90 },
  { position: 3, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 80 },
  { position: 4, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 70 },
  { position: 5, address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5", score: 60 },
]

//TODO: Connected user ranking
export const Leaderboard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
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
        </VStack>
      </CardBody>
    </Card>
  )
}

type LeaderboardRankingComponentProps = {
  ranking: LeaderboardRanking
  isYourRanking?: boolean
}
export const LeaderboardRankingComponent = ({ ranking, isYourRanking }: LeaderboardRankingComponentProps) => {
  const { domain } = useVechainDomain({ addressOrDomain: ranking.address })
  const router = useRouter()

  const onClick = () => {
    router.push(`/profile/${ranking.address}`)
  }

  const positionStyles = useMemo(() => {
    if (ranking.position === 1)
      return {
        text: "🥇",
        borderColor: "#FFD700",
        fontSize: "3xl",
        boxShadow: "0px 0px 5px 0px rgba(255, 215, 0, 0.4)",
      }
    if (ranking.position === 2)
      return {
        text: "🥈",
        borderColor: "#C0C0C0",
        fontSize: "3xl",
        boxShadow: "0px 0px 5px 0px rgba(192, 192, 192, 0.4)",
      }
    if (ranking.position === 3)
      return {
        text: "🥉",
        borderColor: "#CD7F32",
        fontSize: "3xl",
        boxShadow: "0px 0px 5px 0px rgba(205, 127, 50, 0.4)",
      }
    return {
      text: `#${ranking.position}`,
      borderColor: "#EFEFEF",
      fontSize: "xl",
      boxShadow: "0px 0px 5px 0px rgba(0, 0, 0, 0.1)",
    }
  }, [ranking.position])

  const whiteColor = isYourRanking ? "white" : "auto"
  const grayColor = isYourRanking ? "white" : "#6A6A6A"

  return (
    <Card
      onClick={onClick}
      _hover={{
        cursor: "pointer",
        bg: isYourRanking ? "#005EFF" : "#F7F7F7",
        transition: "all 0.2s",
      }}
      boxShadow={positionStyles.boxShadow}
      variant={"baseWithBorder"}
      {...(isYourRanking && { bg: "#004CFC" })}
      pos="relative"
      overflow={"hidden"}
      borderColor={positionStyles.borderColor}>
      <CardBody color={whiteColor} p="12px">
        {isYourRanking && (
          <Image
            src="/images/your-ranking-bg.svg"
            alt="Bg image"
            zIndex={0}
            rounded={"full"}
            pos="absolute"
            right={-7}
            top={"50%"}
            h="full"
            transform={"translateY(-50%)"}
            aria-label="Bg image"
          />
        )}
        <HStack w="full" justify="space-between">
          <HStack spacing={2} zIndex={1}>
            <AddressIcon address={ranking.address} boxSize={8} rounded={"full"} />
            <Box>
              <HStack spacing={1}>
                {isYourRanking && (
                  <Text fontSize="sm" fontWeight={600}>
                    {`(${t("You")})`}
                  </Text>
                )}

                {domain && (
                  <Text fontSize="md" fontWeight={600} h="auto" colorScheme={"gray"}>
                    {domain}
                  </Text>
                )}
                {!domain && (
                  <AddressButton
                    fontSize="sm"
                    fontWeight={600}
                    h="auto"
                    address={ranking.address}
                    size={"sm"}
                    variant={"unstyled"}
                    onClick={e => e.preventDefault()}
                    showAddressIcon={false}
                    showCopyIcon={false}
                    padding={0}
                    digitsBeforeEllipsis={5}
                    digitsAfterEllipsis={3}
                  />
                )}
              </HStack>

              <Text fontSize="sm" color={grayColor} fontWeight={400}>
                <Trans i18nKey="{{value}} actions" values={{ value: ranking.score }} />
              </Text>
            </Box>
          </HStack>
          {ranking.position !== 0 && (
            <Text fontSize={positionStyles.fontSize} fontWeight={600} zIndex={1}>
              {positionStyles.text}
            </Text>
          )}
        </HStack>
      </CardBody>
    </Card>
  )
}
