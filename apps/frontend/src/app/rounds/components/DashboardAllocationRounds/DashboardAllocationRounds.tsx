import { Box, Button, Heading, HStack, Icon, Skeleton, Stack, Text, VStack, Card } from "@chakra-ui/react"
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
import { NoActiveProposalCard } from "../NoActiveProposalCard"

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
        <Stack
          direction={{ base: "column", md: "row" }}
          gap={{ base: "4", md: "4" }}
          justifyContent={{ base: "center", md: "space-between" }}
          w="full"
          align="center">
          <Button
            px="0"
            size="sm"
            textStyle="sm"
            variant="link"
            _hover={{ textDecoration: "underline" }}
            disabled={allocationRound.isFirstRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}
            fontWeight="semibold"
            order={{ base: 2, md: 1 }}
            display={{ base: "none", md: "flex" }}>
            <Icon as={FaAngleLeft} boxSize={4} />
            {t("Previous round")}
          </Button>

          <VStack gap="2" order={{ base: 1, md: 2 }} w={{ base: "full", md: "auto" }}>
            <Heading size={{ base: "xl", md: "2xl" }} fontWeight="normal" textAlign="center">
              <Trans i18nKey={"We're in Round #{{round}}"} values={{ round: selectedRoundId }} t={t} />
            </Heading>
            <Stack direction={{ base: "column", sm: "row" }} gap="2" align="center" justify="center" flexWrap="wrap">
              <Skeleton loading={roundInfoLoading}>
                <Text textStyle="sm" color="text.subtle" textAlign="center">
                  {t("{{from}} to {{to}}", {
                    from: roundInfo.voteStartTimestamp?.format("MMM D"),
                    to: roundInfo.voteEndTimestamp?.format("MMM D"),
                  })}
                </Text>
              </Skeleton>
              <Box display={{ base: "none", sm: "block" }}>
                <DotSymbol color="text.subtle" size="2px" />
              </Box>
              <Skeleton loading={roundInfoLoading}>
                <Text textStyle="sm" color="actions.primary.default" fontWeight="semibold" textAlign="center">
                  {roundInfo.voteEndTimestamp?.fromNow()}
                </Text>
              </Skeleton>
            </Stack>
          </VStack>

          <Button
            px="0"
            fontWeight="semibold"
            _hover={{ textDecoration: "underline" }}
            variant="link"
            textStyle="sm"
            disabled={allocationRound.isLastRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}
            order={{ base: 2, md: 3 }}
            display={{ base: "none", md: "flex" }}>
            {t("Next round")}
            <Icon as={FaAngleRight} fill="currentColor" boxSize={4} />
          </Button>

          <HStack gap="4" w="full" justifyContent="space-between" order={3} display={{ base: "flex", md: "none" }}>
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
        </Stack>
        {selectedRoundId && <AllocationRoundCard roundId={selectedRoundId} />}
        <VStack gap={4} w="full">
          <Heading size={{ base: "xl", md: "xl" }} textAlign="center">
            {t("Proposals and Grants looking for support and approval")}
          </Heading>

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
