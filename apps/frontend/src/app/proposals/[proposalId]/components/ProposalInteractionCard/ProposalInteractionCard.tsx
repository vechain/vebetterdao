import {
  useGetProposalDeposits,
  useGetVotesOnBlock,
  useHasVotedInProposals,
  useIsDepositReached,
  useProposalDepositThreshold,
  useProposalSnapshot,
  useProposalUserDeposit,
} from "@/api"
import { CountdownBoxes, MulticolorBar, RegularModal, ResultsDisplay, ResultsDetailsList } from "@/components"
import { useGetVot3Balance, useProposalVot3Deposit } from "@/hooks"
import { ProposalEnriched, ProposalState } from "@/hooks/proposals/grants/types"
import { Box, Button, Card, Heading, HStack, Icon, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { BigNumber } from "bignumber.js"
import { ethers } from "ethers"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaHeart } from "react-icons/fa"
import { FiBarChart2 } from "react-icons/fi"
import { TbClockHour8 } from "react-icons/tb"

type Props = {
  proposal?: ProposalEnriched
  isVotingPhase: boolean
  daysLeft: number
  hoursLeft: number
  minutesLeft: number
  isLoading: boolean
}

export const ProposalInteractionCard = ({
  proposal,
  isVotingPhase,
  daysLeft,
  hoursLeft,
  minutesLeft,
  isLoading,
}: Props) => {
  // ===== STATE =====
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)

  // ===== HOOKS =====
  const { t } = useTranslation()
  const { sendTransaction } = useProposalVot3Deposit({ proposalId: proposal?.id ?? "" })
  const { account } = useWallet()

  // ===== API QUERIES =====
  const { data: isDepositReached } = useIsDepositReached(proposal?.id ?? "")
  const { data: userHasAlreadyVotedInProposal } = useHasVotedInProposals([proposal?.id ?? ""])
  const { data: userVot3BalanceQueryData } = useGetVot3Balance(account?.address)
  const { data: proposalDepositThresholdQueryData } = useProposalDepositThreshold(proposal?.id ?? "")
  const { data: currentDepositAmountQueryData } = useGetProposalDeposits(proposal?.id ?? "")
  const { data: roundSnapshot } = useProposalSnapshot(proposal?.id ?? "")
  const { data: userVot3OnSnapshot } = useGetVotesOnBlock(Number(roundSnapshot ?? 0), account?.address ?? "")
  const { data: userDeposits } = useProposalUserDeposit(proposal?.id ?? "", account?.address ?? "")

  // ===== COMPUTED VALUES =====
  const currentDepositAmount = BigInt(currentDepositAmountQueryData ?? 0)
  const proposalDepositThreshold = BigInt(proposalDepositThresholdQueryData ?? 0)
  const userVotingPower = Number(userVot3OnSnapshot ?? 0)
  const hasUserAlreadyVoted = userHasAlreadyVotedInProposal?.[proposal?.id ?? ""] ?? false
  const userVot3Balance = Number(userVot3BalanceQueryData?.original ?? 0)
  const proposalDepositReached = isDepositReached ?? false

  const percentageSupported = useMemo(() => {
    if (currentDepositAmount === BigInt(0)) return currentDepositAmount
    if (proposalDepositThreshold === BigInt(0)) return proposalDepositThreshold
    return BigNumber(currentDepositAmount).div(proposalDepositThreshold).times(100).toNumber().toFixed(0)
  }, [currentDepositAmount, proposalDepositThreshold])

  // ===== BUSINESS LOGIC =====
  const shouldShowActionButton = useMemo(() => {
    const isVotingOrSupportPhase =
      [ProposalState.Pending, ProposalState.Active].includes(proposal?.state ?? ProposalState.Pending) || isLoading
    return isVotingOrSupportPhase && !proposalDepositReached && !hasUserAlreadyVoted
  }, [proposal?.state, isLoading, proposalDepositReached, hasUserAlreadyVoted])

  const isActionButtonDisabled = useMemo(() => {
    const disabledStates = [ProposalState.Canceled, ProposalState.Defeated, ProposalState.DepositNotMet]

    // If proposal is canceled, always disable action button
    if (disabledStates.includes(proposal?.state ?? ProposalState.Pending)) {
      return true
    }

    // If it's voting phase AND: User has voted OR User cannot vote
    if (isVotingPhase) {
      return hasUserAlreadyVoted || userVotingPower === 0
    }

    // If it's support phase AND: User has no balance OR Maximum support reached
    if (!isVotingPhase) {
      return userVot3Balance < 1 || proposalDepositReached
    }

    return false
  }, [proposal?.state, isVotingPhase, hasUserAlreadyVoted, userVotingPower, userVot3Balance, proposalDepositReached])

  const progressBarSegments = useMemo(() => {
    return [{ percentage: Number(percentageSupported ?? 0), color: "success.primary" }]
  }, [percentageSupported])

  const supportWith100Vot3 = useCallback(() => {
    sendTransaction({ amount: ethers.parseEther("3000").toString(), proposalId: proposal?.id ?? "" })
  }, [sendTransaction, proposal?.id])

  // ===== MODAL DATA =====
  // TODO: Move these hardcoded values to the API or component props
  const proposalQuorum = 5000000
  const proposalTotalVotes = 2000000
  const proposalWalletsVoted = 122
  const proposalWalletsSupported = 100

  const resultsDetails = useMemo(() => {
    const detailsArray = []

    if (isVotingPhase) {
      detailsArray.push({
        label: t("Total amount needed"),
        value: t("{{amount}} VOT3", { amount: proposalQuorum }),
      })

      detailsArray.push({
        label: t("Amount left to reach"),
        value: t("{{amount}} VOT3", { amount: proposalTotalVotes - proposalQuorum }),
      })

      detailsArray.push({
        label: t("Wallets voted"),
        value: t("{{amount}} VOT3", { amount: proposalWalletsVoted }),
      })
    } else {
      detailsArray.push({
        label: t("Total amount needed"),
        value: t("{{amount}} VOT3", { amount: ethers.formatEther(proposalDepositThreshold ?? 0) }),
      })

      detailsArray.push({
        label: t("Amount left to reach"),
        value: t("{{amount}} VOT3", {
          amount: BigNumber(proposalDepositThreshold).minus(currentDepositAmount).toString(),
        }),
      })

      detailsArray.push({
        label: t("Wallets supported"),
        value: t("{{amount}} VOT3", { amount: proposalWalletsSupported }),
      })
    }

    return detailsArray
  }, [
    isVotingPhase,
    t,
    proposalQuorum,
    proposalTotalVotes,
    proposalWalletsVoted,
    proposalDepositThreshold,
    currentDepositAmount,
    proposalWalletsSupported,
  ])

  return (
    <>
      {/* ===== MAIN CARD ===== */}
      <Skeleton loading={isLoading}>
        <Card.Root variant="baseWithBorder">
          {/* Card Header - Countdown Timer */}
          <Card.Header as={HStack}>
            <Icon as={TbClockHour8} boxSize={5} />
            <Card.Title>
              <Heading>{t("Ends in")}</Heading>
            </Card.Title>
          </Card.Header>

          <Card.Body gap={4}>
            {/* Countdown Display */}
            <CountdownBoxes days={daysLeft} hours={hoursLeft} minutes={minutesLeft} />

            <Separator />

            {/* Results Section Header */}
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiBarChart2} boxSize={5} />
                <Heading>{t("Results")}</Heading>
              </HStack>
              <Button variant="primaryGhost" onClick={() => setIsResultsModalOpen(true)}>
                {t("Details")}
              </Button>
            </HStack>

            {/* Progress Bar */}
            <MulticolorBar segments={progressBarSegments} />

            {/* Results Display */}
            <ResultsDisplay
              percentage={String(percentageSupported)}
              hasVoted={isVotingPhase ? hasUserAlreadyVoted : !!userDeposits}
              tokenAmount={BigInt(0)} // Not shown in main card
              showTokenAmount={false}
            />

            {/* User Support Badge */}
            {userDeposits && (
              <HStack>
                <Text color="gray.600">{t("You supported with")}</Text>
                <Box border="2px solid" borderColor="success.primary" color="success.primary" borderRadius="lg">
                  <HStack gap={2} px="12px" py="8px">
                    <Icon as={FaHeart} boxSize={5} color="success.primary" />
                    <Text>{t("{{amount}} VOT3", { amount: ethers.formatEther(userDeposits) })}</Text>
                  </HStack>
                </Box>
              </HStack>
            )}

            {/* Action Button */}
            {shouldShowActionButton && (
              <Button variant="primaryAction" onClick={supportWith100Vot3} disabled={isActionButtonDisabled}>
                {isVotingPhase ? t("Vote") : t("Support")}
              </Button>
            )}
          </Card.Body>
        </Card.Root>
      </Skeleton>

      {/* ===== RESULTS MODAL ===== */}
      <RegularModal
        size="md"
        showCloseButton
        isCloseable
        ariaTitle={t("Result details")}
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}>
        <VStack w="full" align="stretch" gap={4}>
          {/* Modal Header */}
          <HStack>
            <Icon as={FiBarChart2} boxSize={5} />
            <Heading>{t("Results")}</Heading>
          </HStack>

          {/* Progress Bar */}
          <MulticolorBar segments={progressBarSegments} />

          {/* Results Display with Token Amount */}
          <ResultsDisplay
            percentage={String(percentageSupported)}
            hasVoted={isVotingPhase ? hasUserAlreadyVoted : !!userDeposits}
            tokenAmount={isVotingPhase ? (userDeposits ?? BigInt(0)) : ethers.parseEther(userVot3OnSnapshot ?? "0")}
            showTokenAmount={true}
          />

          <Separator />

          {/* Results Details List */}
          <ResultsDetailsList details={resultsDetails} />
        </VStack>
      </RegularModal>
    </>
  )
}
