import { useAllocationsRound, useAllocationsRoundState, useRoundReward } from "@/api"
import { Box, Button, Image, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"
import { FaRegClock } from "react-icons/fa"
import { useClaimReward } from "@/hooks/useClaimReward"
import { TransactionModal, TransactionModalStatus } from "@/components"
import { Trans, useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { AnalyticsUtils } from "@/utils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"

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

  const {
    sendTransaction,
    resetStatus,
    error: claimRewardError,
    status: claimRewardsStatus,
    txReceipt,
  } = useClaimReward({ roundId })

  const { isOpen, onClose, onOpen } = useDisclosure()

  const handleClaim = useCallback(() => {
    sendTransaction(undefined)
    onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.CLAIM_REWARDS))
  }, [onOpen, sendTransaction])

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [onClose, resetStatus])

  const onTryAgain = useCallback(() => {
    resetStatus()
    handleClaim()
  }, [handleClaim, resetStatus])

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
        <Text fontSize={14} fontWeight={400}>
          <b>{t("You’ve voted on this allocation round!")}</b>
          {!isFinished && ` ${t("You’ll be able to claim your reward when the round is over.")}`}
        </Text>
      )
    }

    if (!hasVoted && !isFinished)
      return (
        <Text fontSize={14} fontWeight={400}>
          <Trans
            i18nKey={"Vote on this allocation round to receive rewards after the voting session has ended."}
            t={t}
          />
        </Text>
      )

    if (!hasVoted && isFinished)
      return (
        <Text fontSize={14} fontWeight={400}>
          <Trans
            i18nKey={"You didn't vote on this allocation round. You can still vote on the next one to receive rewards."}
            t={t}
          />
        </Text>
      )

    if (formattedRoundReward > 0)
      return (
        <Text fontSize={14} fontWeight={400}>
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
      <Text fontSize={14} fontWeight={400}>
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
    <>
      <Box
        borderRadius={16}
        borderWidth={1}
        borderColor={"#D5D5D5"}
        py={8}
        px={6}
        bg={"white"}
        w={"full"}
        mt={{ base: 0, md: 8 }}
        position={"relative"}
        overflow={"clip"}>
        <Image src="/images/voter-reward.png" alt="Voter rewards" pos="absolute" right={0} top={0} zIndex={1} />
        <VStack alignItems={"flex-start"}>
          <Image src="/images/gift.svg" alt="Allocation voter rewards" boxSize={"72px"} />
          <Text fontSize={24} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
            {t("Voting rewards")}
          </Text>
          <Box mt={3} mb={1}>
            {description}
          </Box>
          <Button
            zIndex={2}
            mt={2}
            isDisabled={!canClaim}
            isLoading={isRoundRewardLoading}
            onClick={handleClaim}
            variant={"primaryAction"}
            borderRadius={"full"}
            w={"full"}
            leftIcon={!isFinished ? <FaRegClock /> : undefined}
            bg={canClaim ? "primary" : "#abb0b0"}
            textColor={canClaim ? "white" : "black"}>
            <Text fontSize={{ base: 14, md: 16 }}>{buttonText}</Text>
          </Button>
        </VStack>
      </Box>

      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={t("Rewards claimed!")}
        status={claimRewardError ? TransactionModalStatus.Error : (claimRewardsStatus as TransactionModalStatus)}
        errorDescription={claimRewardError?.reason}
        errorTitle={claimRewardError ? t("Error claiming") : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle={t("Claiming rewards...")}
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%8E%89%20Just%20claimed%20my%20%24B3TR%20rewards%20for%20voting%20in%20the%20%23VeBetterDAO%21%20%0A%0AJoin%20us%20and%20have%20your%20say%20in%20the%20future%20of%20sustainability%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={txReceipt?.meta.txID}
        isClaimingRewards
        isSuccessBeenTrack={true}
      />
    </>
  )
}
