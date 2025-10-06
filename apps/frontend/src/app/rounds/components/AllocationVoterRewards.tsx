import { useAllocationsRound, useAllocationsRoundState, useRoundReward } from "@/api"
import { Box, Button, Icon, Image, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"
import { FaRegClock } from "react-icons/fa"
import { useClaimReward } from "@/hooks/useClaimReward"
import { Trans, useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { AnalyticsUtils } from "@/utils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"
import { Gift } from "iconoir-react"

type Props = {
  roundId: string
  hasVoted?: boolean
}

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(DECIMAL_PLACES)

export const AllocationVoterRewards = ({ roundId, hasVoted }: Props) => {
  const { data: roundState } = useAllocationsRoundState(roundId)

  const { account } = useWallet()

  const { data: allocationRound } = useAllocationsRound(roundId)

  const { data: roundReward, isLoading: isRoundRewardLoading } = useRoundReward(account?.address ?? "", roundId)

  const { t } = useTranslation()

  const { sendTransaction } = useClaimReward({
    roundId,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Claiming rewards...") },
      success: { title: t("Rewards claimed!") },
      error: { title: t("Error claiming rewards!") },
    },
  })

  const handleClaim = useCallback(() => {
    sendTransaction()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CLAIM_REWARDS))
  }, [sendTransaction])

  const formattedRoundReward = useMemo(() => {
    if (!roundReward) return 0

    return Number(roundReward.rewards)
  }, [roundReward])

  const isFinished = useMemo(() => {
    return roundState !== undefined && roundState !== 0
  }, [roundState])

  const remainingTime = useMemo(() => {
    // remove prefix/suffix
    if (!isFinished) return `${allocationRound?.voteEndTimestamp?.fromNow(true)}`
  }, [allocationRound?.voteEndTimestamp, isFinished])

  const description = useMemo(() => {
    if (hasVoted && !isFinished) {
      return (
        <Text textStyle="sm">
          <b>{t("You’ve voted on this allocation round!")}</b>
          {!isFinished && ` ${t("You’ll be able to claim your reward when the round is over.")}`}
        </Text>
      )
    }

    if (!hasVoted && !isFinished)
      return (
        <Text textStyle="sm">
          <Trans
            i18nKey={"Vote on this allocation round to receive rewards after the voting session has ended."}
            t={t}
          />
        </Text>
      )

    if (!hasVoted && isFinished)
      return (
        <Text textStyle="sm">
          <Trans
            i18nKey={"You didn't vote on this allocation round. You can still vote on the next one to receive rewards."}
            t={t}
          />
        </Text>
      )

    if (formattedRoundReward > 0)
      return (
        <Text textStyle="sm">
          <Trans
            i18nKey={
              "You’ve earned {{formattedRoundReward}} B3TR as a reward for voting on this allocation round Claim them now!"
            }
            values={{ formattedRoundReward: compactFormatter.format(formattedRoundReward) }}
            t={t}
          />
        </Text>
      )

    return (
      <Text textStyle="sm">
        <Trans
          i18nKey={
            "You’ve claimed your voter rewards! Remember to vote on the next allocation round to receive more rewards."
          }
          t={t}
        />
      </Text>
    )
  }, [formattedRoundReward, hasVoted, isFinished, t])

  const canClaim = useMemo(() => {
    return formattedRoundReward > 0 && isFinished
  }, [formattedRoundReward, isFinished])

  const buttonText = useMemo(() => {
    if (hasVoted && formattedRoundReward === 0) return t("Rewards claimed")

    if (isFinished && formattedRoundReward > 0) return t("Claim rewards")

    if (!hasVoted && isFinished) return t("No rewards to claim")

    return <Trans i18nKey={"Rewards claimable in {{remainingTime}}"} values={{ remainingTime }} t={t} />
  }, [formattedRoundReward, hasVoted, isFinished, remainingTime, t])

  return (
    <Box
      borderRadius={16}
      borderWidth={1}
      borderColor={"#D5D5D5"}
      py={8}
      px={6}
      bg={"info-bg"}
      w={"full"}
      mt={{ base: 0, md: 8 }}
      position={"relative"}
      overflow={"clip"}>
      <Image src="/assets/icons/voter-reward.webp" alt="Voter rewards" pos="absolute" right={0} top={0} zIndex={1} />
      <VStack alignItems={"flex-start"}>
        <Icon as={Gift} boxSize="16" color="icon.default" />
        <Text textStyle="2xl" fontWeight="bold">
          {t("Voting rewards")}
        </Text>
        <Box mt={3} mb={1}>
          {description}
        </Box>
        <Button
          zIndex={1}
          mt={2}
          disabled={!canClaim}
          loading={isRoundRewardLoading}
          onClick={handleClaim}
          variant={"primary"}
          w={"full"}
          textStyle={{ base: "sm", md: "md" }}>
          {!isFinished ? <Icon as={FaRegClock} color="icon.default" /> : undefined}
          {buttonText}
        </Button>
      </VStack>
    </Box>
  )
}
