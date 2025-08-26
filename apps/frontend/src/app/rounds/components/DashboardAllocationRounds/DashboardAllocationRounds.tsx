import { ProposalState, useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { DotSymbol, ProposalCompactCard, ResponsiveCard } from "@/components"
import { AllocationRoundCard } from "@/components/AllocationRoundsList/components/AllocationRoundCard"
import { useBreakpoints } from "@/hooks"
import { Button, Heading, HStack, Icon, IconButton, Link, Skeleton, Text, VStack } from "@chakra-ui/react"

import { useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"
import { NoActiveProposalCard } from "../NoActiveProposalCard"
import { useRoundProposals } from "../../hooks/useRoundProposals"

export const DashboardAllocationRounds = () => {
  const { t } = useTranslation()
  const { isDesktop } = useBreakpoints()

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
          {isDesktop ? (
            <Button
              px={0}
              fontSize={"md"}
              variant="plain"
              _hover={{
                textDecoration: "underline",
              }}
              color="primary"
              disabled={allocationRound.isFirstRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}
              fontWeight="semibold">
              <Icon as={FaAngleLeft} boxSize={4} />
              {t("Previous round")}
            </Button>
          ) : (
            <IconButton
              fontSize={"md"}
              aria-label="Previous round"
              variant="ghost"
              colorPalette="primary"
              disabled={allocationRound.isFirstRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}>
              <Icon as={FaAngleLeft} boxSize={4} />
            </IconButton>
          )}

          <VStack gap={2}>
            <Heading fontSize="24px" fontWeight={400}>
              <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: selectedRoundId }} t={t} />
            </Heading>
            <HStack gap={2}>
              <Skeleton loading={roundInfoLoading}>
                <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
                  {t("{{from}} to {{to}}", {
                    from: roundInfo.voteStartTimestamp?.format("MMM D"),
                    to: roundInfo.voteEndTimestamp?.format("MMM D"),
                  })}
                </Text>
              </Skeleton>
              <DotSymbol color="#6A6A6A" size="2px" />
              <Skeleton loading={roundInfoLoading}>
                <Text fontSize="14px" color="primary.500" fontWeight={600}>
                  {roundInfo.voteEndTimestamp?.fromNow()}
                </Text>
              </Skeleton>
            </HStack>
          </VStack>
          {isDesktop ? (
            <Button
              px={0}
              fontWeight="semibold"
              _hover={{
                textDecoration: "underline",
              }}
              variant="plain"
              fontSize={"md"}
              color="primary"
              disabled={allocationRound.isLastRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}>
              {t("Next round")}
              <Icon as={FaAngleRight} boxSize={4} />
            </Button>
          ) : (
            <IconButton
              fontSize={"md"}
              aria-label="Next round"
              variant="ghost"
              colorPalette="primary"
              disabled={allocationRound.isLastRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}>
              <Icon as={FaAngleRight} boxSize={5} />
            </IconButton>
          )}
        </HStack>
        {selectedRoundId && <AllocationRoundCard roundId={selectedRoundId} />}
        <VStack gap={4} w="full">
          <Heading fontSize="24px" fontWeight={400}>
            {t("Proposals in this round or looking for support")}
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
        <Link href="/proposals" color="primary" fontWeight="semibold">
          {t("View all proposals")}
        </Link>
      </VStack>
    </ResponsiveCard>
  )
}
