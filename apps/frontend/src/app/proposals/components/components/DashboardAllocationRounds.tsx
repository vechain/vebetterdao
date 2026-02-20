import {
  Badge,
  Box,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Skeleton,
  Text,
  VStack,
  Button,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { Gift, NavArrowLeft, NavArrowRight, Activity } from "iconoir-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LiaBalanceScaleSolid } from "react-icons/lia"

import { ActivityFeed } from "@/components/Activities"
import B3TRIcon from "@/components/Icons/svg/b3tr.svg"
import { ProposalState } from "@/hooks/proposals/grants/types"

import { useAllocationAmount } from "../../../../api/contracts/xAllocations/hooks/useAllocationAmount"
import { useAllocationsRound } from "../../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { ProposalCompactCard } from "../../../../components/ProposalCompactCard"
import { useRoundProposals } from "../../hooks/useRoundProposals"

import { NoActiveProposalCard } from "./NoActiveProposalCard"

export const DashboardAllocationRounds = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const [selectedRoundId, setSelectedRoundId] = useState<string | undefined>()
  const { data: roundInfo, isLoading: roundInfoLoading } = useAllocationsRound(selectedRoundId)
  const { data: roundAmount, isLoading: roundAmountLoading } = useAllocationAmount(selectedRoundId)
  const isCurrentRound = selectedRoundId === currentRoundId

  const distribution = useMemo(() => {
    if (!roundAmount) return { total: 0, appsPercent: 0, votersPercent: 0, treasuryPercent: 0 }
    const toApps = Number(roundAmount.voteXAllocations)
    const toVoters = Number(roundAmount.voteX2Earn)
    const toTreasury = Number(roundAmount.treasury)
    const total = toApps + toVoters + toTreasury
    if (total === 0) return { total: 0, appsPercent: 0, votersPercent: 0, treasuryPercent: 0 }
    return {
      total,
      appsPercent: (toApps / total) * 100,
      votersPercent: (toVoters / total) * 100,
      treasuryPercent: (toTreasury / total) * 100,
    }
  }, [roundAmount])
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
        <HStack justifyContent="space-between" w="full">
          <Grid gridTemplateColumns="repeat(3,max-content)" divideX="1px" divideColor="border.secondary" columnGap="6">
            <VStack gap="1" align="start">
              <Text textStyle="md" color="text.subtle">
                {t("Round")}
              </Text>
              <Heading size="5xl">{selectedRoundId}</Heading>
            </VStack>
            <VStack gap="1" pl="6" align="start">
              <Text textStyle="md" color="text.subtle">
                {t("Round dates")}
              </Text>
              <Skeleton loading={roundInfoLoading}>
                <Heading size="lg">
                  {roundInfo.voteStartTimestamp?.format("MMM D")}
                  {"-"}
                  {roundInfo.voteEndTimestamp?.format("MMM D")}
                </Heading>
              </Skeleton>
              {selectedRoundId === currentRoundId ? (
                <Flex h="full" alignItems="flex-start">
                  <Badge size="sm" variant="positive">
                    {t("Active")}
                  </Badge>
                </Flex>
              ) : (
                <Flex h="full" alignItems="flex-start">
                  <Badge size="sm" variant="neutral">
                    {t("Concluded")}
                  </Badge>
                </Flex>
              )}
            </VStack>
          </Grid>
          <Flex columnGap="4">
            <IconButton
              variant="outline"
              boxSize="44px"
              disabled={allocationRound.isFirstRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}
              aria-label={t("Previous round")}>
              <NavArrowLeft />
            </IconButton>
            <IconButton
              variant="outline"
              boxSize="44px"
              disabled={allocationRound.isLastRound}
              onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}
              aria-label={t("Next round")}>
              <NavArrowRight />
            </IconButton>
          </Flex>
        </HStack>

        <HStack gap="3" w="full" justifyContent="space-between" alignItems="stretch">
          <VStack alignItems="stretch" gap="3">
            <HStack justifyContent="space-between" w="full">
              <HStack gap="2">
                <Icon as={Gift} boxSize="5" color="text.subtle" />
                <Text textStyle="md" color="text.subtle">
                  {isCurrentRound ? t("Total rewards to distribute") : t("Total rewards distributed")}
                </Text>
              </HStack>
            </HStack>
            <Skeleton loading={roundAmountLoading}>
              <HStack gap="2">
                <Icon boxSize="6">
                  <B3TRIcon />
                </Icon>
                <Text textStyle="xl" fontWeight="bold">
                  {getCompactFormatter(2).format(distribution.total)} {"B3TR"}
                </Text>
              </HStack>
            </Skeleton>
          </VStack>
          <Button variant="primary" size="sm" alignSelf="center">
            {t("View details")}
          </Button>
        </HStack>

        {/* {selectedRoundId && <AllocationRoundCard roundId={selectedRoundId} />} */}
        <VStack gap="3" w="full" justifyContent="flex-start" alignItems="stretch">
          <HStack gap="2">
            <Icon as={LiaBalanceScaleSolid} boxSize="6" color="text.subtle" />
            <Text textStyle="md" color="text.subtle">
              {t("Governance")}
            </Text>
          </HStack>

          {!!sortedProposals.length ? (
            <VStack gap="3" w="full" justifyContent="flex-start">
              {sortedProposals.map(proposal => (
                <ProposalCompactCard key={proposal.id} proposal={proposal} proposalState={proposal.state} />
              ))}
            </VStack>
          ) : (
            <NoActiveProposalCard />
          )}
        </VStack>
        <Box display={{ base: "none", md: "block" }} w="full">
          <VStack gap="3" w="full" alignItems="stretch">
            <HStack gap="2">
              <Icon as={Activity} boxSize="5" color="text.subtle" />
              <Text textStyle="md" color="text.subtle">
                {t("Latest activity")}
              </Text>
            </HStack>
            <ActivityFeed roundId={selectedRoundId} />
          </VStack>
        </Box>
      </Card.Body>
    </Card.Root>
  )
}
