import { useCurrentAllocationsRoundId, useSustainabilityUserOverview } from "@/api"
import { AddressButton } from "@/components"
import { AddressIcon } from "@/components/AddressIcon"
import { Box, Card, CardBody, Divider, Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { AddressUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { t } from "i18next"
import { Trans, useTranslation } from "react-i18next"

type LeaderboardRanking = {
  position: number
  address: string
  score: number
}

const YourRanking = {
  position: 20,
  address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5",
  score: 51,
}

//TODO: Connected user ranking
export const Leaderboard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: roundId } = useCurrentAllocationsRoundId()

  const { data } = useSustainabilityUserOverview({ roundId, direction: "desc" })

  const flatLeaderboard =
    data?.pages
      .map(page => page.data)
      .flat()
      .slice(0, 5) ?? []

  const rankings = flatLeaderboard.map((entry, index) => ({
    position: index + 1,
    address: entry?.entity as string,
    score: entry?.actionsRewarded as number,
  }))

  const isRankingInTop5 = rankings.some(ranking => AddressUtils.compareAddresses(ranking.address, account ?? ""))
  return (
    <Card w="full" variant={"baseWithBorder"}>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <VStack spacing={2} align="stretch">
            <Heading size="md">{t("Leaderboard of the week")}</Heading>
            <Text fontSize="sm" color="#6A6A6A" fontWeight={400}>
              {t("Use the apps to do Better Actions and be recognized with more B3TR each week!")}
            </Text>
          </VStack>
          <VStack spacing={4} align="stretch">
            {rankings.map(ranking => (
              <LeaderboardRankingComponent
                ranking={ranking}
                key={ranking.position}
                isYourRanking={AddressUtils.compareAddresses(ranking.address, account ?? "")}
              />
            ))}
            {!isRankingInTop5 && (
              <>
                <Divider w="full" h={1} />
                <LeaderboardRankingComponent ranking={YourRanking} isYourRanking />
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
  const positionText =
    ranking.position === 1
      ? "🥇"
      : ranking.position === 2
        ? "🥈"
        : ranking.position === 3
          ? "🥉"
          : `#${ranking.position}`
  const positionFontSize = [1, 2, 3].includes(ranking.position) ? "3xl" : "lg"

  const whiteColor = isYourRanking ? "white" : "auto"
  const grayColor = isYourRanking ? "white" : "#6A6A6A"

  return (
    <Card
      variant={isYourRanking ? "baseWithBorder" : "filledSmall"}
      {...(isYourRanking && { bg: "#004CFC" })}
      pos="relative"
      overflow={"hidden"}>
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
                <AddressButton
                  fontSize="sm"
                  fontWeight={600}
                  h="auto"
                  address={ranking.address}
                  size={"sm"}
                  variant={"unstyled"}
                  showAddressIcon={false}
                  padding={0}
                  digitsBeforeEllipsis={5}
                  digitsAfterEllipsis={3}
                />
              </HStack>

              <Text fontSize="sm" color={grayColor} fontWeight={400}>
                <Trans i18nKey="{{value}} actions" values={{ value: ranking.score }} />
              </Text>
            </Box>
          </HStack>
          <Text fontSize={positionFontSize} fontWeight={500} zIndex={1}>
            {positionText}
          </Text>
        </HStack>
      </CardBody>
    </Card>
  )
}
