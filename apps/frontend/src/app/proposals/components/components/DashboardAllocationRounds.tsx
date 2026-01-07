import { Button, Heading, HStack, Icon, Skeleton, Text, VStack, Card } from "@chakra-ui/react"
import { useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"

import { AllocationRoundCard } from "@/components/AllocationRoundsList/components/AllocationRoundCard"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { useAllocationsRound } from "../../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { DotSymbol } from "../../../../components/DotSymbol"
import { ProposalCompactCard } from "../../../../components/ProposalCompactCard"
import { useRoundProposals } from "../../hooks/useRoundProposals"

import { NoActiveProposalCard } from "./NoActiveProposalCard"

export const DashboardAllocationRounds = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(selectedRoundId)
  useEffect(() => {
    if (currentRoundId && !selectedRoundId) {
      setSelectedRoundId(currentRoundId)
    }
  }, [currentRoundId, selectedRoundId])
  const onRoundChange = (roundId: string) => () => {
    setSelectedRoundId(roundId)
  }
  const { allocationRound, proposalsToRender } = useRoundProposals(selectedRoundId ?? "1")
  // First active, then looking for support (pending + deposit not met)
  const sortedProposals = useMemo(() => {
    return proposalsToRender.sort((a, b) => {
      const getPriority = (proposal: (typeof proposalsToRender)[0]) => {
        if (proposal.state === ProposalState.Active) return 1
        return 2 // Everything else
      }
      return getPriority(a) - getPriority(b)
    })
  }, [proposalsToRender])
  return (
    <Card.Root variant="primary">
      <Card.Body gap="8">
        <HStack gap="4" justifyContent="space-between" w="full">
          <Button
            px="0"
            size="sm"
            textStyle="sm"
            variant="link"
            _hover={{ textDecoration: "underline" }}
            disabled={allocationRound.isFirstRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}
            fontWeight="semibold">
            <Icon as={FaAngleLeft} boxSize={4} />
            {t("Previous round")}
          </Button>

          <VStack gap="2">
            <Heading size="2xl" fontWeight="normal">
              <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: selectedRoundId }} t={t} />
            </Heading>
            <HStack gap="2">
              <Skeleton loading={roundInfoLoading}>
                <Text textStyle="sm" color="text.subtle">
                  {t("{{from}} to {{to}}", {
                    from: roundInfo.voteStartTimestamp?.format("MMM D"),
                    to: roundInfo.voteEndTimestamp?.format("MMM D"),
                  })}
                </Text>
              </Skeleton>
              <DotSymbol color="text.subtle" size="2px" />
              <Skeleton loading={roundInfoLoading}>
                <Text textStyle="sm" color="actions.primary.default" fontWeight="semibold">
                  {roundInfo.voteEndTimestamp?.fromNow()}
                </Text>
              </Skeleton>
            </HStack>
          </VStack>

          <Button
            px="0"
            fontWeight="semibold"
            _hover={{ textDecoration: "underline" }}
            variant="link"
            textStyle="sm"
            disabled={allocationRound.isLastRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}>
            {t("Next round")}
            <Icon as={FaAngleRight} fill="currentColor" boxSize={4} />
          </Button>
        </HStack>
        {selectedRoundId && <AllocationRoundCard roundId={selectedRoundId} />}
        <VStack gap={4} w="full">
          <Heading size="2xl">{t("Proposals and Grants looking for support and approval")}</Heading>

          {!!sortedProposals.length ? (
            <VStack gap={4} w="full">
              {sortedProposals.map(proposal => (
                <ProposalCompactCard key={proposal.id} proposal={proposal} proposalState={proposal.state} />
              ))}
            </VStack>
          ) : (
            <NoActiveProposalCard />
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
