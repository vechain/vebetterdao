import { useAllocationsRound, useAllocationsRoundsEvents, useCurrentAllocationsRoundId } from "@/api"
import { ProposalFilter, StateFilter } from "@/app/proposals"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { DotSymbol, ProposalCompactCard, ResponsiveCard } from "@/components"
import { AllocationRoundCard } from "@/components/AllocationRoundsList/components/AllocationRoundCard"
import { useBreakpoints } from "@/hooks"
import { Button, Heading, HStack, Icon, IconButton, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"

import { useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"

export const DashboardAllocationRounds = () => {
  const { t } = useTranslation()
  const { isDesktop } = useBreakpoints()

  const { data: allocationRoundsEvents } = useAllocationsRoundsEvents()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>()

  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(selectedRoundId)

  const currentRoundIdProposals = useFilteredProposals([StateFilter.Active, ProposalFilter.LookingForSupport])

  const otherProposals = useMemo(() => {
    if (selectedRoundId === currentRoundId) return []
    return currentRoundIdProposals.allProposals.filter(proposal => proposal.roundIdVoteStart === selectedRoundId)
  }, [currentRoundIdProposals, selectedRoundId, currentRoundId])

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

  const router = useRouter()

  return (
    <ResponsiveCard>
      <VStack spacing={8} w="full">
        <HStack spacing={4} justifyContent="space-between" w="full">
          {isDesktop ? (
            <Button
              variant="link"
              colorScheme="primary"
              leftIcon={<FaAngleLeft />}
              isDisabled={isFirstRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}>
              {t("Previous round")}
            </Button>
          ) : (
            <IconButton
              size={"lg"}
              aria-label="Previous round"
              variant="link"
              colorScheme="primary"
              icon={<Icon as={FaAngleLeft} boxSize={5} />}
              isDisabled={isFirstRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}
            />
          )}

          <VStack spacing={2}>
            <Heading fontSize="24px" fontWeight={400}>
              <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: selectedRoundId }} t={t} />
            </Heading>
            <HStack spacing={2}>
              <Skeleton isLoaded={!roundInfoLoading}>
                <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
                  {t("{{from}} to {{to}}", {
                    from: roundInfo.voteStartTimestamp?.format("MMM D"),
                    to: roundInfo.voteEndTimestamp?.format("MMM D"),
                  })}
                </Text>
              </Skeleton>
              <DotSymbol color="#6A6A6A" size="2px" />
              <Skeleton isLoaded={!roundInfoLoading}>
                <Text fontSize="14px" color="primary.500" fontWeight={600}>
                  {roundInfo.voteEndTimestamp?.fromNow()}
                </Text>
              </Skeleton>
            </HStack>
          </VStack>
          {isDesktop ? (
            <Button
              variant="link"
              colorScheme="primary"
              rightIcon={<FaAngleRight />}
              isDisabled={isLastRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}>
              {t("Next round")}
            </Button>
          ) : (
            <IconButton
              size={"lg"}
              aria-label="Next round"
              variant="link"
              colorScheme="primary"
              icon={<Icon as={FaAngleRight} boxSize={5} />}
              isDisabled={isLastRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}
            />
          )}
        </HStack>
        {selectedRound && <AllocationRoundCard round={selectedRound} />}
        {!!(currentRoundIdProposals.filteredProposals.length || otherProposals.length) && (
          <VStack spacing={4} w="full">
            <Heading fontSize="24px" fontWeight={400}>
              {t("Proposals in this round")}
            </Heading>
            {selectedRound?.roundId === currentRoundId &&
              currentRoundIdProposals.filteredProposals.map(proposal => (
                <ProposalCompactCard key={proposal.proposalId} proposal={proposal} />
              ))}
            {otherProposals.map(proposal => (
              <ProposalCompactCard key={proposal.proposalId} proposal={proposal} />
            ))}
          </VStack>
        )}
        <Button onClick={() => router.push("/proposals")} variant="link" colorScheme="primary">
          {t("View all proposals")}
        </Button>
      </VStack>
    </ResponsiveCard>
  )
}
