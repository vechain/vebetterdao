import {
  useGetProposalDeposits,
  useGetVotesOnBlock,
  useProposalVotes,
  useHasVotedInProposals,
  useIsDepositReached,
  useProposalDepositThreshold,
  useProposalQuorumByType,
  useProposalSnapshot,
  useProposalUserDeposit,
} from "@/api"
import { CountdownBoxes, MulticolorBar, ResultsDisplay } from "@/components"
import { useGetVot3Balance, useProposalVot3Deposit } from "@/hooks"
import { ProposalEnriched, ProposalState, ProposalType as GrantsProposalType } from "@/hooks/proposals/grants/types"
import { Box, Button, Card, Heading, HStack, Icon, Separator, Skeleton, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { BigNumber } from "bignumber.js"
import { ethers } from "ethers"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaHeart } from "react-icons/fa"
import { FiBarChart2 } from "react-icons/fi"
import { TbClockHour8 } from "react-icons/tb"
import { ProposalCastVoteModal } from "../ProposalCastVoteModal/ProposalCastVoteModal"
import { ProposalResultsDetailsModal } from "../ProposalResultsDetailsModal/ProposalResultsDetailsModal"

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
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)

  // ===== HOOKS =====
  const { t } = useTranslation()
  const { sendTransaction } = useProposalVot3Deposit({ proposalId: proposal?.id ?? "" })
  const { account } = useWallet()

  // ===== CONTRACT QUERIES =====
  const { data: isDepositReached } = useIsDepositReached(proposal?.id ?? "")
  const { data: userHasAlreadyVotedInProposal } = useHasVotedInProposals([proposal?.id ?? ""])
  const { data: userVot3BalanceQueryData } = useGetVot3Balance(account?.address)
  const { data: proposalDepositThresholdQueryData } = useProposalDepositThreshold(proposal?.id ?? "")
  const { data: currentDepositAmountQueryData } = useGetProposalDeposits(proposal?.id ?? "")
  const { data: roundSnapshot } = useProposalSnapshot(proposal?.id ?? "")
  const { data: userVot3OnSnapshot } = useGetVotesOnBlock(Number(roundSnapshot ?? 0), account?.address ?? "")
  const { data: userDeposits } = useProposalUserDeposit(proposal?.id ?? "", account?.address ?? "")
  const { data: proposalQuorumQueryData } = useProposalQuorumByType(
    Number(roundSnapshot ?? 0),
    proposal?.type ?? GrantsProposalType.Standard,
  )
  const { data: proposalVotesQueryData } = useProposalVotes(proposal?.id ?? "")

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
    if (proposal?.state === ProposalState.Active) {
      return !hasUserAlreadyVoted && userVotingPower > 0
    }

    if (proposal?.state === ProposalState.Pending) {
      return !proposalDepositReached && userVot3Balance > 0
    }

    return false
  }, [proposal?.state, isLoading, proposalDepositReached, hasUserAlreadyVoted, userVot3Balance, userVotingPower])

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
  const proposalQuorum = BigNumber(proposalQuorumQueryData ?? 0)
  const proposalTotalVotes = BigNumber(proposalVotesQueryData?.totalVotes ?? 0)
  const proposalWalletsVoted = 0 //TODO: This comes from indexer
  const proposalWalletsSupported = 0 //TODO: This comes from indexer
  const resultsDetails = useMemo(() => {
    const detailsArray = []

    if (isVotingPhase) {
      detailsArray.push({
        label: t("Total amount needed"),
        value: t("{{amount}} VOT3", { amount: proposalQuorum }),
      })

      detailsArray.push({
        label: t("Amount left to reach"),
        value: t("{{amount}} VOT3", { amount: proposalTotalVotes.minus(proposalQuorum).toString() }),
      })

      detailsArray.push({
        label: t("Wallets voted"),
        value: t("{{amount}} VOT3", { amount: proposalWalletsVoted }),
      })
    } else {
      detailsArray.push({
        label: t("Total amount needed"),
        value: t("{{amount}} VOT3", { amount: ethers.formatEther(proposalDepositThreshold.toString()) }),
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
              <Button
                variant="primaryAction"
                onClick={isVotingPhase ? () => setIsVoteModalOpen(true) : supportWith100Vot3}
                disabled={isActionButtonDisabled}>
                {isVotingPhase ? t("Vote") : t("Support")}
              </Button>
            )}
          </Card.Body>
        </Card.Root>
      </Skeleton>

      {/* ===== RESULTS MODAL ===== */}
      <ProposalResultsDetailsModal
        isResultsModalOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        progressBarSegments={progressBarSegments}
        percentageSupported={Number(percentageSupported)}
        hasUserAlreadyVoted={hasUserAlreadyVoted}
        userDeposits={userDeposits ?? BigInt(0)}
        proposalDepositThreshold={Number(proposalDepositThreshold)}
        resultsDetails={resultsDetails}
        isVotingPhase={isVotingPhase}
      />

      {/* ===== VOTE MODAL ===== */}
      <ProposalCastVoteModal
        isVoteModalOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        proposalId={proposal?.id ?? ""}
      />
    </>
  )
}
