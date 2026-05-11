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
import { ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"
import { LuCircleCheck, LuCircleDashed, LuSparkles, LuVote, LuZap } from "react-icons/lu"

import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useUserScore } from "@/api/indexer/sustainability/useUserScore"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { PowerUpModal } from "@/components/PowerUpModal"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { ProposalFilter } from "@/store/useProposalFilters"

import { FirstVoteInfoModal } from "./FirstVoteInfoModal"

type Step = {
  key: string
  label: string
  isComplete: boolean
  cta: { label: string; onClick: () => void; icon: ReactNode } | null
}

/**
 * Roadmap card for first-time eligible voters: shown when the user can vote AND has no Galaxy Member NFT
 * (proxy for "has never voted before"). The card lists round tasks and prep-for-next-round tasks with a
 * single contextual primary button that picks the first incomplete step. The card hides itself once all
 * tasks are complete.
 */
export const FirstVoteCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const powerUpModal = useDisclosure()
  const infoModal = useDisclosure()

  const { hasVotesAtSnapshot, isPerson, isLoading: isCanVoteLoading } = useCanUserVote()
  const { data: userGMs, isLoading: isGMsLoading } = useGetUserGMs()
  const { data: currentRoundIdRaw } = useCurrentAllocationsRoundId()
  const currentRoundId = currentRoundIdRaw ?? "0"

  const { data: hasVotedAllocation } = useHasVotedInRound(currentRoundId, account?.address)
  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const { filteredProposals: activeProposals } = useFilteredProposals([ProposalFilter.InThisRound], enrichedProposals)
  const activeProposalIds = useMemo(() => activeProposals.map(p => p.id), [activeProposals])
  const { data: hasVotedInProposals } = useHasVotedInProposals(activeProposalIds, account?.address)

  const { doneActions } = useUserScore()
  const { vot3Balance: snapshotVot3 } = useVotingPowerAtSnapshot()
  const { data: currentVot3 } = useGetVot3Balance(account?.address)

  const hasGM = (userGMs?.length ?? 0) > 0
  // Trigger: user is verified (isPerson), has no GM yet (proxy for "never claimed first GM"),
  // and either had voting power at snapshot OR has somehow voted this round (e.g. via a Navigator
  // delegation). Using hasVotesAtSnapshot/hasVotedAllocation instead of canUserVote keeps the card
  // visible AFTER the user has voted, since canUserVote flips to false on hasVoted=true.
  const isFirstTimeVoter = !!isPerson && !hasGM && (!!hasVotesAtSnapshot || !!hasVotedAllocation)

  const allProposalsVoted =
    activeProposalIds.length === 0
      ? true
      : !!hasVotedInProposals && activeProposalIds.every(id => hasVotedInProposals[id])
  const hasActionThisRound = doneActions > 0
  const poweredUpThisRound = Number(currentVot3?.scaled ?? "0") > Number(snapshotVot3?.scaled ?? "0")

  const goToAllocations = () => router.push("/allocations")
  const goToProposals = () => {
    const firstUnvoted = activeProposals.find(p => !hasVotedInProposals?.[p.id])
    router.push(firstUnvoted ? `/proposals/${firstUnvoted.id}` : "/proposals")
  }
  const goToGalaxyMember = () => router.push("/galaxy-member")
  const goToApps = () => router.push("/apps")

  const steps: Step[] = [
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
      key: "claim-gm",
      label: t("Claim your Galaxy Member NFT"),
      isComplete: hasGM,
      cta: hasGM ? null : { label: t("Claim NFT"), onClick: goToGalaxyMember, icon: <LuSparkles /> },
    },
    {
      key: "keep-actions",
      label: t("Keep using apps to stay eligible next round"),
      isComplete: hasActionThisRound,
      cta: hasActionThisRound ? null : { label: t("Explore apps"), onClick: goToApps, icon: <IoGridOutline /> },
    },
    {
      key: "keep-powering-up",
      label: t("Power up more B3TR to grow your voting power next round"),
      isComplete: poweredUpThisRound,
      cta: poweredUpThisRound ? null : { label: t("Power up"), onClick: powerUpModal.onOpen, icon: <LuZap /> },
    },
  ]

  const allComplete = steps.every(s => s.isComplete)
  const primaryAction = allComplete ? null : (steps.find(s => !s.isComplete)?.cta ?? null)

  const isLoading = isCanVoteLoading || isGMsLoading

  if (isLoading) return null
  if (!isFirstTimeVoter) return null
  if (allComplete) return null

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
            <LuSparkles />
          </Icon>
          <VStack align="flex-start" gap="3" flex="1" minW={0} w="full">
            <VStack align="flex-start" gap="1">
              <Heading size="md" fontWeight="bold" color="status.positive.strong">
                {t("Welcome to your first voting round!")}
              </Heading>
              <Text color="status.positive.strong">
                {t("Make your voice count — here's what you can do this round.")}
              </Text>
            </VStack>
            <Box color="status.positive.strong" w="full">
              <Skeleton loading={isLoading}>
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
            src="/assets/mascot/mascot-proposal.png"
            alt="B3MO"
            boxSize={{ base: "200px", md: "200px" }}
            objectFit="contain"
            flexShrink={0}
            display={{ base: "none", sm: "block" }}
          />
        </Stack>
      </Card.Body>
      <PowerUpModal isOpen={powerUpModal.open} onClose={powerUpModal.onClose} />
      <FirstVoteInfoModal disclosure={infoModal} />
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
