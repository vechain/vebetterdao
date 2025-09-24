import { GroupedProposalVotes } from "@/api/indexer/proposals/useProposalVotes"
import { MulticolorBar, RegularModal, ResultsDetailsList, ResultsDisplay } from "@/components"
import { ProposalState } from "@/hooks"
import { VotingSegment } from "@/types/voting"
import { Box, HStack, Icon, Separator, Stack, Table, Text, VStack } from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import { useMemo } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { formatEther, parseEther } from "viem"

type Props = {
  isResultsModalOpen: boolean
  onClose: () => void
  progressBarSegments: {
    option?: string
    votingPower?: bigint
    voters?: number
    percentage: number
    color: string
    icon: React.ElementType
  }[]
  votingSegments: VotingSegment[]
  userDeposits: bigint
  proposalDepositThreshold: bigint
  totalVotesAtSnapshot: string
  resultsDetails: { label: string; value: string }[]
  proposalState: ProposalState
  proposalId: string
  proposalQuorum: bigint
  proposalTotalVotes: bigint
  proposalVotesData?: {
    totalVoters: number
    totalPower: bigint
    totalWeight: bigint
    votes: GroupedProposalVotes
  }
}

interface ChartQuorumProps {
  proposalQuorum: bigint
  proposalTotalVotes: bigint
  totalVotesAtSnapshot: string
}

type VotingResultContentProps = {
  progressBarSegments: {
    option?: string
    votingPower?: bigint
    voters?: number
    percentage: number
    color: string
    icon: React.ElementType
  }[]
  proposalId: string
  proposalState: ProposalState
  userDeposits: bigint
  proposalDepositThreshold: bigint
  votingSegments: VotingSegment[]
  proposalQuorum: bigint
  proposalTotalVotes: bigint
  proposalVotesData: {
    totalVoters: number
    totalPower: bigint
    totalWeight: bigint
    votes: GroupedProposalVotes
  }
  totalVotesAtSnapshot: string
}

const VotingResultContent = ({
  progressBarSegments,
  proposalId,
  proposalState,
  totalVotesAtSnapshot,
  userDeposits,
  proposalDepositThreshold,
  votingSegments,
  proposalQuorum,
  proposalTotalVotes,
  proposalVotesData,
}: VotingResultContentProps) => {
  return (
    <Stack direction={{ base: "column", md: "row" }} w="full" align="stretch" gap={4}>
      <VStack bg="bg.subtle" p={5} borderRadius="16px" gap={4}>
        <Text fontSize="md" fontWeight="semibold" alignSelf="flex-start">
          {"Votes"}
        </Text>
        {/* Progress Bar */}
        <MulticolorBar segments={progressBarSegments} />
        {/* Results Display with Token Amount */}
        <ResultsDisplay
          proposalId={proposalId}
          segments={progressBarSegments}
          tokenAmount={proposalState === ProposalState.Pending ? (userDeposits ?? BigInt(0)) : proposalDepositThreshold}
          showTokenAmount
        />
        <Table.Root variant="line" bg="transparent">
          <Table.Header w="full">
            <Table.Row>
              <Table.ColumnHeader>{t("Option")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("Voters")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("Voting power")}</Table.ColumnHeader>
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
            {/* Total Row */}
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
        {/* Quorum */}
        <Text fontSize="md" fontWeight="semibold" alignSelf="flex-start">
          {"Quorum"}
        </Text>
        <ChartQuorum
          proposalQuorum={proposalQuorum}
          proposalTotalVotes={proposalTotalVotes}
          totalVotesAtSnapshot={totalVotesAtSnapshot}
        />
      </VStack>
    </Stack>
  )
}

type SupportResultContentProps = {
  progressBarSegments: {
    option?: string
    votingPower?: bigint
    voters?: number
    percentage: number
    color: string
    icon: React.ElementType
  }[]
  proposalId: string
  proposalState: ProposalState
  userDeposits: bigint
  proposalDepositThreshold: bigint
  resultsDetails: { label: string; value: string }[]
}

const SupportResultContent = ({
  progressBarSegments,
  proposalId,
  proposalState,
  userDeposits,
  proposalDepositThreshold,
  resultsDetails,
}: SupportResultContentProps) => {
  return (
    <VStack w="full" align="stretch" gap={4}>
      {/* Progress Bar */}
      <MulticolorBar segments={progressBarSegments} />

      {/* Results Display with Token Amount */}
      <ResultsDisplay
        proposalId={proposalId}
        segments={progressBarSegments}
        tokenAmount={proposalState === ProposalState.Pending ? (userDeposits ?? BigInt(0)) : proposalDepositThreshold}
        showTokenAmount
      />

      <Separator />

      {/* Results Details List */}
      <ResultsDetailsList details={resultsDetails} />
    </VStack>
  )
}

const ChartQuorum = ({ proposalQuorum, proposalTotalVotes, totalVotesAtSnapshot }: ChartQuorumProps) => {
  //100% means totalVotesAtSnapshot
  //Quorum is proposalQuorum
  //To get the percentage filled, is proposalTotalVotes / totalVotesAtSnapshot
  //To get the percentage remaining, is 100 - (proposalTotalVotes / totalVotesAtSnapshot)

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

  const chartData = [
    { name: "Quorum Met", value: Number(percentageFilled), color: filledColor },
    { name: "Remaining", value: Number(percentageRemaining), color: "#e5e7eb" },
  ]

  return (
    <Box p={5} borderRadius="16px">
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
          <Text fontSize="2xl" fontWeight="bold" color={isQuorumReached ? "success.primary" : "gray.700"}>
            {`${percentageFilled}%`}
          </Text>
        </Box>
      </Box>
      {isQuorumReached && (
        <HStack justifyContent="center" mt={2}>
          <Box w={3} h={3} bg="success.primary" borderRadius="full" />
          <Text fontSize="sm" color="success.primary" fontWeight="medium">
            {"Minimum quorum (30%) reached"}
          </Text>
        </HStack>
      )}
    </Box>
  )
}

export const ProposalResultsDetailsModal = ({
  isResultsModalOpen,
  onClose,
  progressBarSegments,
  votingSegments,
  userDeposits,
  proposalDepositThreshold,
  totalVotesAtSnapshot,
  resultsDetails,
  proposalState,
  proposalId,
  proposalQuorum,
  proposalTotalVotes,
  proposalVotesData,
}: Props) => {
  // Determine if we should show voting results or support results
  // Show voting results when:
  // 1. We have voting data available, OR
  // 2. Proposal is in voting/post-voting states (Active, Succeeded, Defeated, Queued, Executed, Completed)
  const hasVotingData = proposalVotesData && votingSegments && votingSegments.length > 0
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
    <RegularModal
      size="lg"
      showCloseButton
      isCloseable
      ariaTitle={t("Result details")}
      isOpen={isResultsModalOpen}
      onClose={onClose}>
      {showVotingResults && proposalVotesData ? (
        <VotingResultContent
          progressBarSegments={progressBarSegments}
          proposalId={proposalId}
          proposalState={proposalState}
          userDeposits={userDeposits}
          proposalDepositThreshold={proposalDepositThreshold}
          totalVotesAtSnapshot={totalVotesAtSnapshot}
          votingSegments={votingSegments}
          proposalQuorum={proposalQuorum}
          proposalTotalVotes={proposalTotalVotes}
          proposalVotesData={proposalVotesData}
        />
      ) : (
        <SupportResultContent
          progressBarSegments={progressBarSegments}
          proposalId={proposalId}
          proposalState={proposalState}
          userDeposits={userDeposits}
          proposalDepositThreshold={proposalDepositThreshold}
          resultsDetails={resultsDetails}
        />
      )}
    </RegularModal>
  )
}
