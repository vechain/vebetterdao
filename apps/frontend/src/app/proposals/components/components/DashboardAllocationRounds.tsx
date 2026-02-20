import {
  Badge,
  Box,
  Card,
  Flex,
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
import NextLink from "next/link"
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

type Props = {
  isBottomSheet?: boolean
}

export const DashboardAllocationRounds: React.FC<Props> = ({ isBottomSheet = false }) => {
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
    <Card.Root variant={"primary"} px={isBottomSheet ? 0 : undefined} borderWidth={isBottomSheet ? 0 : undefined}>
      <Card.Body gap="8">
        <Flex justifyContent="space-between" w="full" alignItems="center" gap="2">
          <IconButton
            variant="outline"
            boxSize="44px"
            display={{ base: "flex", md: "none" }}
            disabled={allocationRound.isFirstRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") - 1).toString())}
            aria-label={t("Previous round")}>
            <NavArrowLeft />
          </IconButton>

          <HStack divideX="1px" divideColor="border.secondary" gap="6">
            <VStack gap="1" align={{ base: "center", md: "start" }}>
              <Text textStyle="md" color="text.subtle">
                {t("Round")}
              </Text>
              <Heading size="6xl">{selectedRoundId}</Heading>
            </VStack>
            <VStack gap="1" pl="6" align={{ base: "center", md: "start" }}>
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
                  <Badge size="md" variant="positive">
                    {t("Active")}
                  </Badge>
                </Flex>
              ) : (
                <Flex h="full" alignItems="flex-start">
                  <Badge size="md" variant="neutral">
                    {t("Concluded")}
                  </Badge>
                </Flex>
              )}
            </VStack>
          </HStack>

          <IconButton
            variant="outline"
            boxSize="44px"
            display={{ base: "flex", md: "none" }}
            disabled={allocationRound.isLastRound}
            onClick={onRoundChange((parseInt(selectedRoundId ?? "1") + 1).toString())}
            aria-label={t("Next round")}>
            <NavArrowRight />
          </IconButton>

          <Flex columnGap="4" alignSelf="center" display={{ base: "none", md: "flex" }}>
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
        </Flex>

        <Flex gap="3" w="full" justifyContent="space-between" alignItems="stretch" flexWrap="wrap">
          <VStack alignItems="stretch" gap="3" minW="0">
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
          <Button asChild variant="primary" size="sm" alignSelf="end">
            <NextLink href={`/allocations/round?round=${selectedRoundId}`}>{t("View round")}</NextLink>
          </Button>
        </Flex>

        {/* {selectedRoundId && <AllocationRoundCard roundId={selectedRoundId} />} */}
        {!!sortedProposals.length && (
          <VStack gap="3" w="full" justifyContent="flex-start" alignItems="stretch">
            <HStack gap="2">
              <Icon as={LiaBalanceScaleSolid} boxSize="6" color="text.subtle" />
              <Text textStyle="md" color="text.subtle">
                {t("Governance")}
              </Text>
            </HStack>

            <VStack gap="3" w="full" justifyContent="flex-start">
              {sortedProposals.map(proposal => (
                <ProposalCompactCard key={proposal.id} proposal={proposal} proposalState={proposal.state} />
              ))}
            </VStack>
          </VStack>
        )}
        <Box w="full">
          <VStack gap="3" w="full" alignItems="stretch">
            <HStack gap="2">
              <Icon as={Activity} boxSize="5" color="text.subtle" />
              <Text textStyle="md" color="text.subtle">
                {t("Activity")}
              </Text>
            </HStack>
            <ActivityFeed roundId={selectedRoundId} />
          </VStack>
        </Box>
      </Card.Body>
    </Card.Root>
  )
}
