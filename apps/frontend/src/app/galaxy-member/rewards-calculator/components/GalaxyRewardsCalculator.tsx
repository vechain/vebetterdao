import React, { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Image, Card, HStack, Heading, Stack, Text } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import {
  usePotentialRewards,
  useCurrentAllocationsRoundId,
  useVoteRegisteredEvents,
  useGetRewardsEventsOrFunction,
  useCycleToTotal,
  useAllocationAmount,
  useParticipatedInGovernance,
  useLatestVotingRound,
  useSelectedGmNft,
} from "@/api"
import { GalaxyCarrousel } from "./GalaxyCarrousel"
import { BaseTooltip } from "@/components"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const DECIMAL_PLACES = 2
const compactFormatter = getCompactFormatter(DECIMAL_PLACES)

export const GalaxyRewardsCalculator = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { gmLevel, gmId, b3trToUpgradeGMToNextLevel } = useSelectedGmNft()
  const usersGM = { gmLevel, gmId, b3trToUpgradeGMToNextLevel }
  const router = useRouter()

  const [selectedGMLevel, setSelectedGMLevel] = useState<string>()
  const { data: currentRound } = useCurrentAllocationsRoundId()
  const latestRounds = useLatestVotingRound(currentRound ?? "", account?.address ?? "")

  const { data: emissionAmount } = useAllocationAmount(latestRounds?.roundId)
  const { data: cycleToVoterToTotalEvents } = useVoteRegisteredEvents({
    cycle: Number(latestRounds?.roundId),
    voter: account?.address ?? "",
  })
  const { data: hasVoted } = useParticipatedInGovernance(account?.address ?? "")
  const { data: cycleToTotal } = useCycleToTotal(latestRounds.roundId)

  const currentReward = useGetRewardsEventsOrFunction(account?.address ?? "", latestRounds.roundId)
  const emissionAmount_voterRewards = Number(emissionAmount?.voteX2Earn)

  const cycleToVoterToTotal = useMemo(() => {
    return cycleToVoterToTotalEvents?.reduce((acc, event) => acc + event.rewardWeightedVote, 0)
  }, [cycleToVoterToTotalEvents])

  const potentialRewards = usePotentialRewards(
    cycleToTotal,
    emissionAmount_voterRewards,
    cycleToVoterToTotal ?? 0,
    selectedGMLevel,
    gmLevel,
  )

  const estimatedRewards = useMemo(() => {
    if (account && selectedGMLevel && cycleToVoterToTotal && cycleToTotal && emissionAmount_voterRewards) {
      return potentialRewards
    }
    return null
  }, [account, selectedGMLevel, cycleToVoterToTotal, cycleToTotal, emissionAmount_voterRewards, potentialRewards])

  const handleNftSelect = (GMLevel: string | undefined) => {
    setSelectedGMLevel(GMLevel)
  }

  useEffect(() => {
    if (!hasVoted) router.push("/")
  }, [hasVoted, router])

  if (!account || !hasVoted) return <></>

  return (
    <Card
      p={7}
      variant="baseWithBorder"
      alignItems="center"
      style={{
        backgroundImage: `url('/assets/backgrounds/stardust.webp')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      w="full">
      <Heading alignSelf={"flex-start"} pb={5} color={"white"}>
        {t("Rewards calculator")}
      </Heading>
      <Stack
        direction={["column", "column", "row", "row"]}
        gap={10}
        h={"full"}
        w={"full"}
        justifyContent={"space-between"}
        alignItems={"center"}>
        <GalaxyCarrousel setSelectedGMLevel={handleNftSelect} usersGM={usersGM} />

        <Stack spacing={4} p={4} alignItems="center" justifyContent="flex-end" w="full">
          {/* ESTIMATE CARD */}
          <Card rounded="8px" w="full" gap={3} py={4} px={4} bg="rgba(255, 255, 255, 0.4)">
            <HStack position="relative" justify="space-between">
              <Heading fontSize="x-large">{t("Estimated Rewards")}</Heading>
              <BaseTooltip
                text={t(
                  "The rewards are estimated based on the parameters of round {{round}} (GM level, B3TR allocated, VOT3 used, total voters). The exact rewards will only be known once the round ends and all participants have cast their votes.",
                  { round: latestRounds?.roundId },
                )}>
                <span>
                  <UilInfoCircle style={{ marginRight: "8px", cursor: "pointer" }} />
                </span>
              </BaseTooltip>
            </HStack>

            <HStack display="flex" alignItems="center" borderLeft="4px" pl={4}>
              <Image boxSize="7" rounded="full" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
              <Text bg="transparent" fontWeight="semibold" px={2} w="full" fontSize="4xl">
                {compactFormatter.format(estimatedRewards?.potentialRewards ?? 0)}
              </Text>
            </HStack>
          </Card>
          {/* END ESTIMATED CARD */}

          {/* ACTUAL CARD */}
          <Card rounded="8px" w="full" gap={3} py={4} px={4} bg="rgba(255, 255, 255, 0.4)">
            <HStack position="relative" justify="space-between">
              <Heading fontSize="x-large">{t("Actual Rewards")}</Heading>
              <BaseTooltip text={t("The actual reward from the round {{round}}", { round: latestRounds?.roundId })}>
                <span>
                  <UilInfoCircle style={{ marginRight: "8px", cursor: "pointer" }} />
                </span>
              </BaseTooltip>
            </HStack>

            <HStack display="flex" alignItems="center" borderLeft="4px" pl={4}>
              <Image boxSize="7" rounded="full" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />

              <Text bg="transparent" fontWeight="semibold" px={2} w="full" fontSize="4xl">
                {compactFormatter.format(Number(currentReward ?? 0))}
              </Text>
            </HStack>
          </Card>
          {/* END ACTUAL CARD */}
        </Stack>
      </Stack>
      <Text fontSize="xs" color="white" textAlign="center"></Text>
    </Card>
  )
}
