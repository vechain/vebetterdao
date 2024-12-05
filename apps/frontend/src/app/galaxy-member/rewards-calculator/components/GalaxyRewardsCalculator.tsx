import React, { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Input, Image, Card, HStack, Heading, Stack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/dapp-kit-react"
import {
  usePotentialRewards,
  useCurrentAllocationsRoundId,
  useVoteRegisteredEvents,
  useGetRewardsEventsOrFunction,
  useCycleToTotal,
  useAllocationAmount,
} from "@/api"
import { GalaxyCarrousel } from "./GalaxyCarrousel"
import { BaseTooltip } from "@/components"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"

const DECIMAL_PLACES = 4
const compactFormatter = getCompactFormatter(DECIMAL_PLACES)

export const GalaxyRewardsCalculator = () => {
  // TODO : Calculate rewards only if the user have already voted
  const { t } = useTranslation()
  const { account } = useWallet()

  const [selectedGMLevel, setSelectedGMLevel] = useState<string>()
  // const [isLoading, setLoading] = useState<boolean>(false)

  const { data: currentRound } = useCurrentAllocationsRoundId()
  const { data: emissionAmount } = useAllocationAmount(currentRound)
  const { data: cycleToVoterToTotalEvents } = useVoteRegisteredEvents({
    cycle: Number(currentRound),
    voter: account ?? "",
  })

  const currentReward = useGetRewardsEventsOrFunction(account ?? "", currentRound)
  const cycleToTotal = useCycleToTotal(currentRound)
  const emissionAmount_voterRewards = Number(emissionAmount?.voteX2Earn)

  const cycleToVoterToTotal = useMemo(() => {
    return cycleToVoterToTotalEvents?.reduce((acc, event) => acc + event.rewardWeightedVote, 0)
  }, [cycleToVoterToTotalEvents])

  // todo : cleanup type, rmv the conditionnal check, should return directly the right type
  const potentialRewards = usePotentialRewards(
    cycleToVoterToTotal ?? 0,
    cycleToTotal ?? 0,
    emissionAmount_voterRewards,
    selectedGMLevel,
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

  if (!account) return null

  return (
    <Card
      p={7}
      variant="baseWithBorder"
      alignItems="center"
      style={{
        backgroundImage: `url('/images/stardust.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}>
      <Heading alignSelf={"flex-start"} color={"white"} pb={5}>
        {t("Rewards calculator")}
      </Heading>
      <Stack direction={["column", "row", "row"]} gap={10} h={"full"} justifyContent={"space-between"}>
        <GalaxyCarrousel setSelectedGMLevel={handleNftSelect} />

        <Stack spacing={4} p={4} alignItems="center" justifyContent="flex-end">
          {/* ESTIMATE CARD */}
          <Card
            variant={"primaryBoxShadow"}
            rounded="8px"
            w="full"
            gap={7}
            py={4}
            px={4}
            bg="whiteAlpha.50"
            backdropFilter="blur(8px)"
            borderRadius="lg"
            border="1px solid"
            borderColor="whiteAlpha.200">
            <HStack position="relative">
              <Heading color={"white"} fontSize="x-large">
                {t("Estimated Rewards")}
              </Heading>
              <BaseTooltip
                text={t(
                  "The rewards are estimated based on the previous week's voting participation. The exact rewards are only known when a round ends and all participants have cast their votes.",
                )}>
                <span>
                  <UilInfoCircle color={"white"} style={{ marginRight: "8px", cursor: "pointer" }} />
                </span>
              </BaseTooltip>
            </HStack>

            <HStack display="flex" alignItems="center" borderLeft="4px" borderColor="white" pl={4}>
              <Image boxSize="7" rounded="full" bg="gray.800" src="/images/logo/b3tr_logo.svg/" alt="" />
              {/* {isLoading ? (
                <Spinner />
              ) : ( */}
              <Input
                type="text"
                bg="transparent"
                color="white"
                fontWeight="semibold"
                px={2}
                w="full"
                fontSize="4xl"
                focusBorderColor="none"
                placeholder="0"
                readOnly
                value={compactFormatter.format(estimatedRewards?.potentialRewards ?? 0)}
              />
              {/* )} */}
            </HStack>
          </Card>
          {/* END ESTIMATED CARD */}

          {/* ACTUAL CARD */}
          <Card
            variant={"primaryBoxShadow"}
            rounded="8px"
            w="full"
            gap={7}
            py={4}
            px={4}
            bg="whiteAlpha.50"
            backdropFilter="blur(8px)"
            borderRadius="lg"
            borderColor="whiteAlpha.200">
            <HStack position="relative">
              <Heading color={"white"} fontSize="x-large">
                {t("Actual Rewards")}
              </Heading>
              <BaseTooltip
                text={t(
                  "The rewards are estimated based on the previous week's voting participation. The exact rewards are only known when a round ends and all participants have cast their votes.",
                )}>
                <span>
                  <UilInfoCircle color={"white"} style={{ marginRight: "8px", cursor: "pointer" }} />
                </span>
              </BaseTooltip>
            </HStack>

            <HStack display="flex" alignItems="center" borderLeft="4px" borderColor="white" pl={4}>
              <Image boxSize="7" rounded="full" bg="gray.800" src="/images/logo/b3tr_logo.svg/" alt="" />
              {/* {isLoading ? (
                <Spinner />
              ) : ( */}
              <Input
                type="text"
                bg="transparent"
                color="white"
                fontWeight="semibold"
                px={2}
                w="full"
                fontSize="4xl"
                focusBorderColor="none"
                placeholder="0"
                readOnly
                value={compactFormatter.format(Number(currentReward ?? 0))}
              />
              {/* )} */}
            </HStack>
          </Card>
          {/* END ACTUAL CARD */}
        </Stack>
      </Stack>
    </Card>
  )
}
