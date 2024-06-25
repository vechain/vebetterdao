import { useAllocationsRound, useAllocationsRoundState, useRoundReward } from "@/api"
import { Box, Button, Image, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCallback, useMemo } from "react"
import { FaRegClock } from "react-icons/fa"
import { useClaimReward } from "@/hooks/useClaimReward"
import { TransactionModal } from "@/components"

type Props = {
  roundId: string
  hasVoted?: boolean
}

export const AllocationVoterRewards = ({ roundId, hasVoted }: Props) => {
  const { data: roundState } = useAllocationsRoundState(roundId)

  const { account } = useWallet()

  const { data: allocationRound } = useAllocationsRound(roundId)

  const { data: roundReward, isLoading: isRoundRewardLoading } = useRoundReward(account ?? "", roundId)

  const {
    sendTransaction,
    resetStatus,
    error: claimRewardError,
    status: claimRewardsStatus,
    txReceipt,
    sendTransactionTx,
  } = useClaimReward({ roundId, roundReward: roundReward ?? "" })

  const { isOpen, onClose, onOpen } = useDisclosure()

  const handleClaim = useCallback(() => {
    sendTransaction()
    onOpen()
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

    return Number(roundReward)
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
          <b>You’ve voted on this allocation round!</b>
          {!isFinished && " You’ll be able to claim your reward when the round is over."}
        </Text>
      )
    }

    if (!hasVoted && !isFinished) {
      return (
        <Text fontSize={14} fontWeight={400}>
          Vote on this allocation round to <b>receive rewards</b> after the voting session has ended.
        </Text>
      )
    }

    if (!hasVoted && isFinished)
      return (
        <Text fontSize={14} fontWeight={400}>
          You didn't vote on this allocation round. You can still <b>vote on the next one to receive rewards.</b>
        </Text>
      )

    if (formattedRoundReward > 0)
      return (
        <Text fontSize={14} fontWeight={400}>
          You’ve earned <b>{formattedRoundReward} B3TR</b> as a reward for voting on this allocation round.{" "}
          <b>Claim them now!</b>
        </Text>
      )

    return (
      <Text fontSize={14} fontWeight={400}>
        You’ve claimed your voter rewards! Remember to <b>vote on the next allocation round</b> to receive more rewards.
      </Text>
    )
  }, [formattedRoundReward, hasVoted, isFinished])

  const canClaim = useMemo(() => {
    return formattedRoundReward > 0 && isFinished
  }, [formattedRoundReward, isFinished])

  const buttonText = useMemo(() => {
    if (hasVoted && formattedRoundReward === 0) return "Rewards claimed"

    if (isFinished && formattedRoundReward > 0) return "Claim rewards"

    return `Rewards claimable in ${remainingTime}`
  }, [formattedRoundReward, hasVoted, isFinished, remainingTime])

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
            Voting rewards
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
        successTitle={"Rewards claimed!"}
        status={claimRewardError ? "error" : claimRewardsStatus}
        errorDescription={claimRewardError?.reason}
        errorTitle={claimRewardError ? "Error claiming" : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle="Claiming rewards..."
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%8E%89%20Just%20claimed%20my%20%24B3TR%20rewards%20for%20voting%20in%20the%20%23VeBetterDAO%21%20%0A%0AJoin%20us%20and%20have%20your%20say%20in%20the%20future%20of%20sustainability%20at%20https%3A%2F%2Fvebetterdao.org.%20%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        isClaimingRewards
      />
    </>
  )
}
