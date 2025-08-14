import { useAllocationsRound, useCurrentAllocationsRoundId } from "@/api"
import { DotSymbol, ProposalCompactCard, ResponsiveCard } from "@/components"
import { AllocationRoundCard } from "@/components/AllocationRoundsList/components/AllocationRoundCard"
import { useBreakpoints } from "@/hooks"
import { Button, Heading, HStack, Icon, IconButton, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useRouter } from "next/navigation"

import { useEffect, useMemo, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6"
import { NoActiveProposalCard } from "../NoActiveProposalCard"
import { useRoundProposals } from "../../hooks/useRoundProposals"
import { ProposalState } from "@/hooks/proposals/grants/types"

export const DashboardAllocationRounds = () => {
  const { t } = useTranslation()
  const router = useRouter()
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
      <VStack spacing={8} w="full">
        <HStack spacing={4} justifyContent="space-between" w="full">
          {isDesktop ? (
            <Button
              variant="link"
              colorScheme="primary"
              leftIcon={<FaAngleLeft />}
              isDisabled={allocationRound.isFirstRound}
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
              isDisabled={allocationRound.isFirstRound}
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
              isDisabled={allocationRound.isLastRound}
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
              isDisabled={allocationRound.isLastRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}
            />
          )}
        </HStack>
        {selectedRoundId && <AllocationRoundCard roundId={selectedRoundId} />}
        <VStack spacing={4} w="full">
          <Heading fontSize="24px" fontWeight={400}>
            {t("Proposals in this round or looking for support")}
          </Heading>

          {!!sortedProposals.length ? (
            <VStack spacing={4} w="full">
              {sortedProposals.map(proposal => (
                <ProposalCompactCard key={proposal.id} proposal={proposal} proposalState={proposal.state} />
              ))}
            </VStack>
          ) : (
            <NoActiveProposalCard />
          )}
        </VStack>
        <Button onClick={() => router.push("/proposals")} variant="link" colorScheme="primary">
          {t("View all proposals")}
        </Button>
      </VStack>
    </ResponsiveCard>
  )
}
