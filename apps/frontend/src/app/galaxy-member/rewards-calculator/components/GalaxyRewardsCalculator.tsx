import React, { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Image, Card, HStack, Heading, Stack, Text } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import {
  useCurrentAllocationsRoundId,
  useAllocationAmount,
  useParticipatedInGovernance,
  useSelectedGmNft,
  useGMLevelsOverview,
  usePotentialRewardsFromIndexer,
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
  const usersGM = { gmLevel, gmId, b3trToUpgradeGMToNextLevel: Number(b3trToUpgradeGMToNextLevel) }
  const router = useRouter()

  const { data: gmLevelOverview } = useGMLevelsOverview()

  const [selectedGMLevel, setSelectedGMLevel] = useState<string>()
  const { data: currentRound } = useCurrentAllocationsRoundId()
  let round = currentRound

  const { data: emissionAmountCurrent } = useAllocationAmount(round ?? "")
  if (emissionAmountCurrent?.gm == "0.0") {
    round = (Number(currentRound) + 1).toString()
  }

  const { data: emissionAmountNext } = useAllocationAmount(round ?? "")
  const emissionAmount = emissionAmountCurrent?.gm == "0.0" ? emissionAmountNext : emissionAmountCurrent

  const { data: hasVoted } = useParticipatedInGovernance(account?.address ?? "")

  const emissionAmount_gmRewards = Number(emissionAmount?.gm) || 0

  const { potentialRewards, currentRewards } = usePotentialRewardsFromIndexer(
    gmLevelOverview || [],
    emissionAmount_gmRewards,
    selectedGMLevel ?? "",
    usersGM.gmLevel,
  )

  const estimatedRewards = useMemo(() => {
    if (account && selectedGMLevel && emissionAmount_gmRewards) {
      return { potentialRewards, currentRewards }
    }
    return null
  }, [account, selectedGMLevel, emissionAmount_gmRewards, potentialRewards])

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
              <Heading fontSize="x-large">{t("Potential Rewards")}</Heading>
              <BaseTooltip
                text={t(
                  "Rewards are estimated based on round {{round}} and the current GM distribution (levels, multipliers, and number of NFTs). Final rewards will be determined when the round ends and all votes are cast.",
                  { round: round },
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
              <Heading fontSize="x-large">{t("Estimated Expected Rewards")}</Heading>
              <BaseTooltip
                text={t(
                  "The current estimated rewards for round {{round}}. Note: these are based on the current GM supply and may change as more users vote or upgrade their NFTs.",
                  { round: round },
                )}>
                <span>
                  <UilInfoCircle style={{ marginRight: "8px", cursor: "pointer" }} />
                </span>
              </BaseTooltip>
            </HStack>

            <HStack display="flex" alignItems="center" borderLeft="4px" pl={4}>
              <Image boxSize="7" rounded="full" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />

              <Text bg="transparent" fontWeight="semibold" px={2} w="full" fontSize="4xl">
                {compactFormatter.format(Number(estimatedRewards?.currentRewards ?? 0))}
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
