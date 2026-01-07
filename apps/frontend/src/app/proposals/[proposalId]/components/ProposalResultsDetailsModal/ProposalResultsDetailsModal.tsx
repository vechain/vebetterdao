import { Box, CloseButton, Dialog, Heading, HStack, Icon, Link, Stack, Table, Text, VStack } from "@chakra-ui/react"
import { UilCheckCircle } from "@iconscout/react-unicons"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { formatEther, parseEther } from "viem"

import { GroupedProposalVotes } from "@/api/indexer/proposals/useProposalVotes"
import { ProposalVotersCard } from "@/app/components/ProposalVotersCard"
import HeartSolidIcon from "@/components/Icons/svg/heart-solid.svg"
import { Modal } from "@/components/Modal"
import { PROPOSALS_QUORUM_DOCS_LINK } from "@/constants/links"
import { VotingSegment } from "@/types/voting"

import { MulticolorBar } from "../../../../../components/MulticolorBar/MulticolorBar"
import { ResultsDisplay } from "../../../../../components/Proposal/ResultsDisplay"
import { ProposalState } from "../../../../../hooks/proposals/grants/types"

interface ProgressBarSegment {
  option?: string
  votingPower?: bigint
  voters?: number
  percentage: number
  color: string
  icon: React.ElementType
}
interface ProposalVotesData {
  totalVoters: number
  totalPower: bigint
  totalWeight: bigint
  votes: GroupedProposalVotes
}
// Base interfaces
interface BaseModalProps {
  isResultsModalOpen: boolean
  onClose: () => void
}
interface BaseProposalProps {
  proposalId: string
  progressBarSegments: ProgressBarSegment[]
}
interface BaseVotingProps {
  proposalQuorum: bigint
  proposalQuorumNumerator: bigint
  proposalTotalVotes: bigint
  totalVotesAtSnapshot: string
}

// Extended interfaces
interface ChartQuorumProps extends BaseVotingProps {}

interface VotingResultContentProps extends BaseProposalProps, BaseVotingProps {
  votingSegments: VotingSegment[]
  proposalVotesData: ProposalVotesData
}

interface SupportResultContentProps extends BaseProposalProps {
  proposalSupportThreshold: bigint
  proposalSupportAmount: bigint
  totalSupporters: number
  userDeposits: bigint
}

interface ProposalResultsDetailsModalProps extends BaseModalProps, BaseProposalProps, BaseVotingProps {
  proposalState: ProposalState
  votingSegments: VotingSegment[]
  proposalVotesData?: ProposalVotesData
  userDeposits: bigint
  proposalSupportAmount: bigint
  proposalSupportThreshold: bigint
  totalSupporters: number
}

// Components
const VotingResultContent = ({
  progressBarSegments,
  proposalId,
  totalVotesAtSnapshot,
  votingSegments,
  proposalQuorum,
  proposalQuorumNumerator,
  proposalTotalVotes,
  proposalVotesData,
}: VotingResultContentProps) => {
  const { t } = useTranslation()
  return (
    <Stack direction={{ base: "column", md: "row" }} w="full" align="stretch" gap={4}>
      <VStack bg="bg.subtle" p={5} borderRadius="16px" gap={4}>
        <Text textStyle="md" fontWeight="semibold" alignSelf="flex-start">
          {"Votes"}
        </Text>
        <MulticolorBar segments={progressBarSegments} />
        <ResultsDisplay proposalId={proposalId} segments={progressBarSegments} />
        <Table.Root columnGap="auto">
          <Table.Header w="full">
            <Table.Row>
              <Table.ColumnHeader>{t("Option")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("Voters")}</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">{t("Voting power")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {votingSegments.map(segment => (
              <Table.Row key={`${segment.option}-${proposalId}`}>
                <Table.Cell>
                  <HStack>
                    <Icon as={segment.icon} color={segment.color} boxSize={"16px"} />
                    <Text fontWeight="semibold" color="text.subtle">
                      {segment.option}
                    </Text>
                  </HStack>
                </Table.Cell>
                <Table.Cell color="text.subtle">{segment.voters}</Table.Cell>
                <Table.Cell color="text.subtle" textAlign="end">
                  {humanNumber(formatEther(segment.votingPower))}
                </Table.Cell>
              </Table.Row>
            ))}
            <Table.Row>
              <Table.Cell>
                <Text fontWeight="semibold" color="text.subtle">
                  {"Total"}
                </Text>
              </Table.Cell>
              <Table.Cell>
                <Text color="text.subtle">{proposalVotesData.totalVoters}</Text>
              </Table.Cell>
              <Table.Cell textAlign="end">
                <Text color="text.subtle">{humanNumber(formatEther(proposalVotesData.totalWeight))}</Text>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </VStack>
      <VStack bg="bg.subtle" p={5} borderRadius="16px">
        <Text textStyle="md" fontWeight="semibold" alignSelf="flex-start">
          {"Quorum"}
        </Text>
        <ChartQuorum
          proposalQuorumNumerator={proposalQuorumNumerator}
          proposalQuorum={proposalQuorum}
          proposalTotalVotes={proposalTotalVotes}
          totalVotesAtSnapshot={totalVotesAtSnapshot}
        />
      </VStack>
    </Stack>
  )
}

const SupportResultContent = ({
  progressBarSegments,
  proposalId,
  proposalSupportThreshold,
  proposalSupportAmount,
  totalSupporters,
  userDeposits,
}: SupportResultContentProps) => {
  const { t } = useTranslation()
  const helperText = useMemo(() => {
    const formattedSupportAmount = humanNumber(formatEther(proposalSupportAmount ?? 0n))
    const formattedDepositThreshold = humanNumber(formatEther(proposalSupportThreshold ?? 0n))
    return `${formattedSupportAmount} / ${formattedDepositThreshold} VOT3`
  }, [proposalSupportThreshold, proposalSupportAmount])

  const userSupportPercentage = useMemo(() => {
    if (!userDeposits || !proposalSupportThreshold) return 0
    const result = Number(userDeposits) / Number(proposalSupportThreshold)
    return Math.min(result, 1) * 100
  }, [userDeposits, proposalSupportThreshold])

  return (
    <VStack w="full" align="stretch" gap={"24px"}>
      <MulticolorBar segments={progressBarSegments} />
      <ResultsDisplay proposalId={proposalId} segments={progressBarSegments} helperText={helperText} />
      <VStack gap={"24px"} w="full">
        {userSupportPercentage > 0 && (
          <HStack justify="space-between" w="full">
            <HStack>
              <Icon as={HeartSolidIcon} color="status.positive.primary" boxSize={5} />
              <Text textStyle="md" color="text.subtle">
                {t("{{percentage}}% (your support)", { percentage: userSupportPercentage.toFixed(2) })}
              </Text>
            </HStack>
            <Text textStyle="md" color="text.subtle">
              {humanNumber(formatEther(userDeposits), undefined, "VOT3")}
            </Text>
          </HStack>
        )}
        <HStack justify="space-between" w="full">
          <Text textStyle="md" color="text.subtle">
            {"Supporters"}
          </Text>
          <Text textStyle="md" color="text.subtle">
            {totalSupporters}
          </Text>
        </HStack>
      </VStack>
    </VStack>
  )
}

const ChartQuorum = ({
  proposalQuorum,
  proposalTotalVotes,
  totalVotesAtSnapshot,
  proposalQuorumNumerator,
}: ChartQuorumProps) => {
  const percentageFilled = useMemo(() => {
    if (!totalVotesAtSnapshot || !proposalTotalVotes) return BigInt(0)
    const totalVotesAtSnapshotBigInt = parseEther(totalVotesAtSnapshot.toString())
    return (proposalTotalVotes * BigInt(100)) / totalVotesAtSnapshotBigInt
  }, [proposalTotalVotes, totalVotesAtSnapshot])

  const percentageRemaining = BigInt(100) - percentageFilled
  const isQuorumReached = proposalTotalVotes >= proposalQuorum

  const filledColor = useMemo(() => {
    return isQuorumReached ? "#22c55e" : "#DF6A6E"
  }, [isQuorumReached])

  const chartData = useMemo(
    () => [
      { name: "Quorum Met", value: Number(percentageFilled), color: filledColor },
      { name: "Remaining", value: Number(percentageRemaining), color: "#e5e7eb" },
    ],
    [percentageFilled, percentageRemaining, filledColor],
  )

  return (
    <VStack alignContent="flex-end" justifyContent="center" borderRadius="16px" w="full" h="full">
      <Box w="200px" h="200px" position="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={85}
              startAngle={90}
              endAngle={450}
              stroke="none"
              cornerRadius={8}>
              {chartData?.map(entry => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" textAlign="center">
          <Text textStyle="2xl" fontWeight="bold" color={isQuorumReached ? "status.positive.primary" : "gray.700"}>
            {`${percentageFilled}%`}
          </Text>
        </Box>
      </Box>
      {isQuorumReached && (
        <HStack justifyContent="center" w="full" textWrap={"nowrap"}>
          <Icon as={UilCheckCircle} color="status.positive.primary" boxSize={5} />
          <Text textStyle="xs" fontWeight="semibold">
            <Trans
              i18nKey="Minimum <Link>quorum</Link> ({{quorumNumerator}}%) reached"
              values={{
                quorumNumerator: proposalQuorumNumerator,
              }}
              components={{
                Link: <Link target="_blank" href={PROPOSALS_QUORUM_DOCS_LINK} textDecoration="underline" />,
              }}
            />
          </Text>
        </HStack>
      )}
    </VStack>
  )
}

// Main component
export const ProposalResultsDetailsModal = ({
  isResultsModalOpen,
  onClose,
  progressBarSegments,
  votingSegments,
  userDeposits,
  proposalSupportThreshold,
  totalVotesAtSnapshot,
  proposalState,
  proposalId,
  proposalQuorum,
  proposalQuorumNumerator,
  proposalTotalVotes,
  proposalSupportAmount,
  totalSupporters,
  proposalVotesData,
}: ProposalResultsDetailsModalProps) => {
  const { t } = useTranslation()

  // Determine display mode based on proposal state and data availability
  const hasVotingData = proposalVotesData && votingSegments?.length > 0
  const isVotingOrPostVotingState = [
    ProposalState.Active,
    ProposalState.Succeeded,
    ProposalState.Defeated,
    ProposalState.Queued,
    ProposalState.Executed,
    ProposalState.Completed,
    ProposalState.InDevelopment,
  ].includes(proposalState)

  const showVotingResults = hasVotingData && isVotingOrPostVotingState

  return (
    <Modal
      modalProps={{ size: { base: "xs", md: "lg" } }}
      showHeader={false}
      title={
        <HStack alignItems="center" justifyContent="space-between" mb={{ base: "unset", md: "8" }}>
          <Heading textAlign="left" size="xl">
            {t("Result details")}
          </Heading>
          <Dialog.CloseTrigger asChild position="static">
            <CloseButton size="md" />
          </Dialog.CloseTrigger>
        </HStack>
      }
      isOpen={isResultsModalOpen}
      onClose={onClose}>
      {showVotingResults ? (
        <VStack gap="2">
          <VotingResultContent
            progressBarSegments={progressBarSegments}
            proposalId={proposalId}
            totalVotesAtSnapshot={totalVotesAtSnapshot}
            votingSegments={votingSegments}
            proposalQuorum={proposalQuorum}
            proposalQuorumNumerator={proposalQuorumNumerator}
            proposalTotalVotes={proposalTotalVotes}
            proposalVotesData={proposalVotesData}
          />

          <ProposalVotersCard proposalId={proposalId} totalVoters={proposalVotesData.totalVoters} />
        </VStack>
      ) : (
        <SupportResultContent
          progressBarSegments={progressBarSegments}
          proposalId={proposalId}
          userDeposits={userDeposits}
          proposalSupportThreshold={proposalSupportThreshold}
          proposalSupportAmount={proposalSupportAmount}
          totalSupporters={totalSupporters}
        />
      )}
    </Modal>
  )
}
