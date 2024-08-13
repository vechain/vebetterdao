import { useAllocationsRound, useAllocationsRoundsEvents, useCurrentAllocationsRoundId } from "@/api"
import { ProposalFilter, StateFilter } from "@/app/proposals"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { DotSymbol, ProposalCompactCard, ResponsiveCard } from "@/components"
import { AllocationRoundCard } from "@/components/AllocationRoundsList/components/AllocationRoundCard"
import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"

export const DashboardAllocationRounds = () => {
  const { t } = useTranslation()

  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { data: currentRoundId, isLoading: currentRoundIdLoading } = useCurrentAllocationsRoundId()

  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>()

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(selectedRoundId)

  const currentRoundIdProposals = useFilteredProposals([
    StateFilter.Active,
    ProposalFilter.InThisRound,
    ProposalFilter.LookingForSupport,
    ProposalFilter.UpcomingVoting,
  ])

  const otherProposals = currentRoundIdProposals.allProposals.filter(
    proposal => proposal.roundIdVoteStart === selectedRoundId,
  )

  useEffect(() => {
    if (currentRoundId && !selectedRoundId) {
      setSelectedRoundId(currentRoundId)
    }
  }, [currentRoundId, selectedRoundId])

  const selectedRound = useMemo(() => {
    if (!allocationRoundsEvents || !selectedRoundId) return
    return allocationRoundsEvents.created.find(round => round.roundId === selectedRoundId)
  }, [allocationRoundsEvents, selectedRoundId])

  const isLastRound = selectedRoundId === allocationRoundsEvents?.created.length.toString()
  const isFirstRound = selectedRoundId === "1"

  const onRoundChange = (roundId: string) => () => {
    setSelectedRoundId(roundId)
  }

  return (
    <ResponsiveCard>
      <VStack spacing={8} w="full">
        <HStack spacing={4} justifyContent="space-between" w="full">
          <Button
            variant="link"
            colorScheme="primary"
            leftIcon={<FaAngleLeft />}
            isDisabled={isFirstRound}
            onClick={onRoundChange((parseInt(selectedRoundId || "1") - 1).toString())}>
            {t("Previous round")}
          </Button>
          <VStack spacing={2}>
            <Heading fontSize="24px" fontWeight={400}>
              We're on Round <b>#{selectedRoundId}</b>
            </Heading>
            <HStack spacing={2}>
              <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
                {roundInfo.voteStartTimestamp?.format("MMM D")} to {roundInfo.voteEndTimestamp?.format("MMM D")}
              </Text>
              <DotSymbol color="#6A6A6A" size="2px" />
              <Text fontSize="14px" color="primary.500" fontWeight={600}>
                {roundInfo.voteEndTimestamp?.fromNow()}
              </Text>
            </HStack>
          </VStack>
          <Button
            variant="link"
            colorScheme="primary"
            rightIcon={<FaAngleRight />}
            isDisabled={isLastRound}
            onClick={onRoundChange((parseInt(selectedRoundId || "1") + 1).toString())}>
            {t("Next round")}
          </Button>
        </HStack>
        {selectedRound && <AllocationRoundCard round={selectedRound} />}
        <VStack spacing={4} w="full">
          <Heading fontSize="24px" fontWeight={400}>
            Proposals in this round
          </Heading>
          {selectedRound?.roundId === currentRoundId &&
            currentRoundIdProposals.filteredProposals.map(proposal => (
              <ProposalCompactCard key={proposal.proposalId} proposal={proposal} />
            ))}
          {otherProposals.length > 0 &&
            otherProposals.map(proposal => <ProposalCompactCard key={proposal.proposalId} proposal={proposal} />)}
        </VStack>
      </VStack>
    </ResponsiveCard>
  )
}
