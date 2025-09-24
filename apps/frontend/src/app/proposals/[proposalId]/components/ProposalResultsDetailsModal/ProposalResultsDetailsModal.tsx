import { GroupedProposalVotes } from "@/api/indexer/proposals/useProposalVotes"
import { MulticolorBar, RegularModal, ResultsDetailsList, ResultsDisplay } from "@/components"
import { ProposalState } from "@/hooks"
import { VotingSegment } from "@/types/voting"
import { Box, Grid, GridItem, HStack, Icon, Separator, Table, Text, VStack } from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { formatEther } from "viem"

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
}

const VotingResultContent = ({
  progressBarSegments,
  proposalId,
  proposalState,
  userDeposits,
  proposalDepositThreshold,
  votingSegments,
  proposalQuorum,
  proposalTotalVotes,
  proposalVotesData,
}: VotingResultContentProps) => {
  return (
    <VStack w="full" align="stretch">
      <Grid templateColumns="1fr 1fr" gap={4}>
        <GridItem w="full" bg="bg.subtle" p={5} borderRadius="16px">
          <Text>{"Votes"}</Text>
          {/* Progress Bar */}
          <MulticolorBar segments={progressBarSegments} />
          {/* Results Display with Token Amount */}
          <ResultsDisplay
            proposalId={proposalId}
            segments={progressBarSegments}
            tokenAmount={
              proposalState === ProposalState.Pending ? (userDeposits ?? BigInt(0)) : proposalDepositThreshold
            }
            showTokenAmount
          />
          <Table.Root variant="line" mt={5} bg="transparent">
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
                      <Text>{segment.option}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>{segment.voters}</Table.Cell>
                  <Table.Cell textAlign="end">{humanNumber(formatEther(segment.votingPower))}</Table.Cell>
                </Table.Row>
              ))}
              {/* Total Row */}
              <Table.Row>
                <Table.Cell>
                  <Text fontWeight="bold">{"Total"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontWeight="bold">{proposalVotesData.totalVoters}</Text>
                </Table.Cell>
                <Table.Cell textAlign="end">
                  <Text fontWeight="bold">{humanNumber(formatEther(proposalVotesData.totalWeight))}</Text>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </GridItem>
        <GridItem bg="bg.subtle" p={5} borderRadius="16px">
          {/* Quorum */}
          <Text>{"Quorum"}</Text>
          <ChartQuorum proposalQuorum={proposalQuorum} proposalTotalVotes={proposalTotalVotes} />
        </GridItem>
      </Grid>
    </VStack>
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

const ChartQuorum = ({ proposalQuorum, proposalTotalVotes }: ChartQuorumProps) => {
  const quorumPercentage = proposalQuorum > 0 ? Number((proposalTotalVotes * BigInt(100)) / proposalQuorum) : 0

  // Cap at 100% for display
  const displayPercentage = Math.min(quorumPercentage, 100)
  const remainingPercentage = Math.max(100 - displayPercentage, 0)

  const chartData = [
    { name: "Quorum Met", value: displayPercentage, color: "#22c55e" },
    { name: "Remaining", value: remainingPercentage, color: "#e5e7eb" },
  ]

  const isQuorumReached = quorumPercentage >= 100

  return (
    <Box p={5} borderRadius="16px">
      <Text textAlign="center" mb={4} fontSize="lg" fontWeight="semibold">
        {"Quorum"}
      </Text>
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
            {`${displayPercentage}%`}
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
