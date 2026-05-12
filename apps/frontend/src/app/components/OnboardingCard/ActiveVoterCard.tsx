import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  Image,
  List,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCircleCheck, LuCircleDashed, LuGift, LuTrendingUp, LuVote, LuZap } from "react-icons/lu"

import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useVotingRewards } from "@/api/contracts/rewards/hooks/useVotingRewards"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useTransactions } from "@/api/indexer/transactions/useTransactions"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { PowerUpModal } from "@/components/PowerUpModal"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useUserOnboardingPhase } from "@/hooks/useUserOnboardingPhase"
import { ProposalFilter } from "@/store/useProposalFilters"

import { ActiveVoterInfoModal } from "./ActiveVoterInfoModal"

type Step = {
  key: string
  label: string
  isComplete: boolean
  cta: { label: string; onClick: () => void; icon: ReactNode } | null
}

/**
 * Phase 3 of the voter journey — for users who have voted at least once (have a Galaxy
 * Member NFT). Lists the regular per-round tasks: claim past rewards, vote this round,
 * vote on proposals, and grow voting power. The card hides itself once all available
 * tasks for the current round are complete and re-appears next round when there's
 * something new to do.
 */
export const ActiveVoterCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const powerUpModal = useDisclosure()
  const infoModal = useDisclosure()

  const { phase, isLoading: isPhaseLoading } = useUserOnboardingPhase()

  const { data: currentRoundIdRaw } = useCurrentAllocationsRoundId()
  const currentRoundId = currentRoundIdRaw ?? "0"
  const currentRoundIdNumber = Number(currentRoundId)
  const currentRoundInfo = useAllocationsRound(currentRoundId)
  const currentRoundVoteStartBlock = currentRoundInfo.data?.voteStart
    ? Number(currentRoundInfo.data.voteStart)
    : undefined

  // Journey-end detection — on-chain rather than localStorage, so it works retroactively for
  // every existing user on release. We query the user's B3TR_CLAIM_REWARD history (page 0,
  // size 10) and check whether any claim happened BEFORE the current round's vote-start
  // block. If yes, the user already lived through at least one full claim-cycle in a past
  // round, which means they've voted, claimed, and (almost certainly) minted their GM — i.e.
  // their onboarding journey is done. The current-round claim is excluded by the block
  // comparison, so the card stays visible for the rest of the round of completion.
  const { data: claimTxData, isLoading: isClaimTxLoading } = useTransactions(account?.address ?? "", {
    size: 10,
    eventName: ["B3TR_CLAIM_REWARD"],
  })
  const pastClaims = useMemo(() => claimTxData?.pages.flatMap(p => p.data) ?? [], [claimTxData])
  const hasGraduated = useMemo(() => {
    if (!currentRoundVoteStartBlock) return false
    return pastClaims.some(tx => Number(tx.blockNumber) < currentRoundVoteStartBlock)
  }, [pastClaims, currentRoundVoteStartBlock])

  const { data: hasVotedAllocation } = useHasVotedInRound(currentRoundId, account?.address)
  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const { filteredProposals: activeProposals } = useFilteredProposals([ProposalFilter.InThisRound], enrichedProposals)
  const activeProposalIds = useMemo(() => activeProposals.map(p => p.id), [activeProposals])
  const { data: hasVotedInProposals } = useHasVotedInProposals(activeProposalIds, account?.address)

  const { vot3Balance: snapshotVot3 } = useVotingPowerAtSnapshot()
  const { data: currentVot3 } = useGetVot3Balance(account?.address)

  const votingRewardsQuery = useVotingRewards(currentRoundIdNumber, account?.address ?? undefined)
  const roundRewards = votingRewardsQuery.data?.roundsRewards ?? []
  const claimableTotal = Number(votingRewardsQuery.data?.claimableTotalFormatted ?? 0)
  const hasClaimableRewards = claimableTotal > 0

  const claimRewardsMutation = useClaimRewards({
    roundRewards,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Claiming rewards...") },
      success: { title: t("Rewards claimed!") },
      error: { title: t("Error claiming rewards!") },
    },
  })

  const goToAllocations = useCallback(() => router.push("/allocations"), [router])
  const goToProposals = useCallback(() => {
    const firstUnvoted = activeProposals.find(p => !hasVotedInProposals?.[p.id])
    router.push(firstUnvoted ? `/proposals/${firstUnvoted.id}` : "/proposals")
  }, [activeProposals, hasVotedInProposals, router])
  const handleClaim = useCallback(() => claimRewardsMutation.sendTransaction(), [claimRewardsMutation])

  const allProposalsVoted =
    activeProposalIds.length === 0
      ? true
      : !!hasVotedInProposals && activeProposalIds.every(id => hasVotedInProposals[id])
  const poweredUpThisRound = Number(currentVot3?.scaled ?? "0") > Number(snapshotVot3?.scaled ?? "0")

  const steps: Step[] = [
    // Always include the claim row in Phase 3 — having a Galaxy Member NFT implies past voting,
    // so the claim task is always conceptually relevant. The row flips between pending (with CTA)
    // and done (with check) based on whether anything is currently claimable.
    {
      key: "claim-rewards",
      label: hasClaimableRewards
        ? t("Claim your {{amount}} B3TR voter rewards", { amount: claimableTotal })
        : t("Voter rewards claimed"),
      isComplete: !hasClaimableRewards,
      cta: hasClaimableRewards ? { label: t("Claim"), onClick: handleClaim, icon: <LuGift /> } : null,
    },
    {
      key: "vote-allocation",
      label: t("Vote in this round's allocation"),
      isComplete: !!hasVotedAllocation,
      cta: hasVotedAllocation ? null : { label: t("Vote now"), onClick: goToAllocations, icon: <LuVote /> },
    },
    ...(activeProposalIds.length > 0
      ? [
          {
            key: "vote-proposals",
            label: t("Vote on active governance proposals"),
            isComplete: allProposalsVoted,
            cta: allProposalsVoted ? null : { label: t("Review proposals"), onClick: goToProposals, icon: <LuVote /> },
          },
        ]
      : []),
    {
      key: "keep-powering-up",
      label: t("Power up more B3TR to grow your voting power next round"),
      isComplete: poweredUpThisRound,
      cta: poweredUpThisRound ? null : { label: t("Power up"), onClick: powerUpModal.onOpen, icon: <LuZap /> },
    },
  ]

  const allComplete = steps.every(s => s.isComplete)
  const primaryAction = allComplete ? null : (steps.find(s => !s.isComplete)?.cta ?? null)

  if (isPhaseLoading || isClaimTxLoading) return null
  if (phase !== "active-voter") return null
  // Hide permanently once the user has any past-round claim history. We DON'T hide on
  // allComplete this round — the card sticks around until the next round opens, at which
  // point the claim that just happened becomes a "past round" claim and trips this gate.
  if (hasGraduated) return null

  return (
    <Card.Root
      bg="status.positive.subtle"
      border="1px solid"
      borderColor="status.positive.primary"
      rounded="xl"
      w="full"
      h="full"
      p="4"
      position="relative"
      overflow="hidden">
      <Card.Body position="relative" p="0">
        <Stack direction={{ base: "column", md: "row" }} align="flex-start" gap="4">
          <Icon
            asChild
            color="status.positive.strong"
            boxSize="9"
            flexShrink={0}
            display={{ base: "none", md: "inline-flex" }}>
            <LuTrendingUp />
          </Icon>
          <VStack align="flex-start" gap="3" flex="1" minW={0} w="full">
            <VStack align="flex-start" gap="1">
              <Heading size="md" fontWeight="bold" color="status.positive.strong">
                {t("Keep your voting cycle going")}
              </Heading>
              <Text color="status.positive.strong">{t("Claim, vote, and grow your power — every round.")}</Text>
            </VStack>
            <Box color="status.positive.strong" w="full">
              <Skeleton loading={isPhaseLoading}>
                <List.Root variant="plain" gap="2">
                  {steps.map(step => (
                    <StepRow key={step.key} step={step} />
                  ))}
                </List.Root>
              </Skeleton>
            </Box>
            <Stack
              direction={{ base: "column", sm: "row" }}
              gap="2"
              mt="4"
              w="full"
              align={{ base: "stretch", sm: "center" }}>
              {primaryAction && (
                <Button size="sm" variant="tertiary" onClick={primaryAction.onClick}>
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              )}
              <Button size="sm" variant="link" color="status.positive.strong" onClick={infoModal.onOpen}>
                {t("Learn more")}
              </Button>
            </Stack>
          </VStack>
          <Image
            src="/assets/mascot/13_Present.webp"
            alt="B3MO"
            boxSize={{ base: "120px", md: "160px" }}
            objectFit="contain"
            flexShrink={0}
            display={{ base: "none", sm: "block" }}
          />
        </Stack>
      </Card.Body>
      <PowerUpModal isOpen={powerUpModal.open} onClose={powerUpModal.onClose} />
      <ActiveVoterInfoModal disclosure={infoModal} />
    </Card.Root>
  )
}

const StepRow = ({ step }: { step: Step }) => (
  <List.Item>
    <Stack
      direction={{ base: "column", sm: "row" }}
      justify="space-between"
      align={{ base: "stretch", sm: "center" }}
      gap="2"
      w="full">
      <HStack gap="2" align="flex-start" flex="1" minW={0}>
        <Icon asChild color="inherit" boxSize="5" flexShrink={0} mt="0.5">
          {step.isComplete ? <LuCircleCheck /> : <LuCircleDashed />}
        </Icon>
        <span>{step.label}</span>
      </HStack>
    </Stack>
  </List.Item>
)
