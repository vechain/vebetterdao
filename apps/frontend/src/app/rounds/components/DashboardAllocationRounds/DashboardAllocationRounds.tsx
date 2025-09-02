import { ProposalState, useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { DotSymbol, ProposalCompactCard, ResponsiveCard } from "@/components"
import { AllocationRoundCard } from "@/components/AllocationRoundsList/components/AllocationRoundCard"
import { Button, Heading, HStack, Icon, Link, Skeleton, Text, VStack } from "@chakra-ui/react"

import { useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"
import { NoActiveProposalCard } from "../NoActiveProposalCard"
import { useRoundProposals } from "../../hooks/useRoundProposals"

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
    <ResponsiveCard>
      <VStack gap={8} w="full">
        <HStack gap={4} justifyContent="space-between" w="full">
          <Button
            px={0}
            size="sm"
            textStyle={"md"}
            variant="plain"
            _hover={{ textDecoration: "underline" }}
            color="actions.secondary.text-lighter"
            disabled={allocationRound.isFirstRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}
            fontWeight="semibold">
            <Icon as={FaAngleLeft} boxSize={4} />
            {t("Previous round")}
          </Button>

          <VStack gap={2}>
            <Heading size="2xl" fontWeight="normal">
              <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: selectedRoundId }} t={t} />
            </Heading>
            <HStack gap={2}>
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
                <Text textStyle="sm" color="actions.secondary.text-lighter" fontWeight="semibold">
                  {roundInfo.voteEndTimestamp?.fromNow()}
                </Text>
              </Skeleton>
            </HStack>
          </VStack>

          <Button
            px={0}
            fontWeight="semibold"
            _hover={{ textDecoration: "underline" }}
            variant="plain"
            textStyle={"md"}
            color="actions.secondary.text-lighter"
            disabled={allocationRound.isLastRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}>
            {t("Next round")}
            <Icon as={FaAngleRight} fill="currentColor" boxSize={4} />
          </Button>
        </HStack>
        {selectedRoundId && <AllocationRoundCard roundId={selectedRoundId} />}
        <VStack alignItems="flex-start" gap={4} w="full">
          <Heading size="md" fontWeight="semibold">
            {t("Proposals")} {sortedProposals.length ? `(${sortedProposals.length})` : "(0)"}
          </Heading>

          {!!sortedProposals.length ? (
            <VStack gap={4} w="full">
              {sortedProposals.map(proposal => (
                <ProposalCompactCard key={proposal.proposalId} proposal={proposal} proposalState={proposal.state} />
              ))}
            </VStack>
          ) : (
            <NoActiveProposalCard />
          )}
        </VStack>
        <Link href="/proposals" color="actions.secondary.text-lighter" fontWeight="semibold">
          {t("View all proposals")}
        </Link>
      </VStack>
    </ResponsiveCard>
  )
}
