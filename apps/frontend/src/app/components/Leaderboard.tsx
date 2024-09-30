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
const LeaderboardRankings: LeaderboardRanking[] = [
  {
    position: 1,
    address: "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa",
    score: 100,
  },
  {
    position: 2,
    address: "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68",
    score: 98,
  },
  {
    position: 3,
    address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5",
    score: 86,
  },
  {
    position: 4,
    address: "0xF370940aBDBd2583bC80bfc19d19bc216C88Ccf0",
    score: 72,
  },
  {
    position: 5,
    address: "0x99602e4Bbc0503b8ff4432bB1857F916c3653B85",
    score: 60,
  },
]

const YourRanking = {
  position: 20,
  address: "0x0F872421Dc479F3c11eDd89512731814D0598dB5",
  score: 51,
}
export const Leaderboard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const isRankingInTop5 = LeaderboardRankings.some(ranking =>
    AddressUtils.compareAddresses(ranking.address, account ?? ""),
  )
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
            {LeaderboardRankings.map(ranking => (
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
      variant={isYourRanking ? "baseWithBorder" : "filled"}
      bg={isYourRanking ? "#004CFC" : "auto"}
      pos="relative"
      overflow={"hidden"}>
      <CardBody p={2} color={whiteColor}>
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
