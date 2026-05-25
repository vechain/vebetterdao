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
import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useUserScore } from "@/api/indexer/sustainability/useUserScore"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { GetFreeNFTModal } from "@/components/GmNFTAndNodeCard/GetFreeNFTModal"
import { MintNFTModal } from "@/components/MintNFTModal"
import { PowerUpModal } from "@/components/PowerUpModal"
import { useMintNFT } from "@/hooks/galaxyMember/useMintNFT"
import { useProposalEnriched } from "@/hooks/proposals/common/useProposalEnriched"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useUserOnboardingPhase } from "@/hooks/useUserOnboardingPhase"
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
  const getFreeNftModal = useDisclosure()
  const mintSuccessModal = useDisclosure()

  const { phase, isLoading: isPhaseLoading } = useUserOnboardingPhase()
  const { data: userGMs } = useGetUserGMs()
  const selectedGM = userGMs?.find(gm => gm.isSelected)
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

  // Source of truth: useUserOnboardingPhase. The "first-vote" phase covers eligible voters
  // who haven't yet been through a full claim cycle — including the round in which they mint
  // their first GM (the phase hook holds them here until a past-round claim event exists).
  const hasGM = (userGMs?.length ?? 0) > 0
  const isFirstTimeVoter = phase === "first-vote"

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
  const goToApps = () => router.push("/apps")

  // GM mint flow: confirmation modal → freeMint tx → celebration modal on success
  const { sendTransaction: freeMint, resetStatus: resetFreeMintStatus } = useMintNFT({
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Minting your GM NFT...") },
      success: {
        title: t("GM NFT Minted!"),
        description: t("Your Galaxy Member NFT has been successfully minted. Welcome to the club!"),
        socialDescriptionEncoded:
          "As%20a%20Voter%20in%20VeBetter%2C%20I%E2%80%99ve%20just%20minted%20my%20GM%20Earth%20NFT.%20%F0%9F%8C%8D%0A%0AGet%20yours%20here%20%F0%9F%91%89%20%20https%3A%2F%2Fgovernance.vebetterdao.org%2F%0A%0A%23GalaxyMember%20%23VeBetter",
        onSuccess: mintSuccessModal.onOpen,
      },
    },
    onFailure: () => resetFreeMintStatus(),
  })
  const handleClaimGM = () => getFreeNftModal.onOpen()
  const handleConfirmMint = () => {
    getFreeNftModal.onClose()
    freeMint()
  }
  const handleMintSuccessClose = () => {
    resetFreeMintStatus()
    mintSuccessModal.onClose()
    // The mint flow is fully done — send the user to their freshly minted NFT.
    router.push("/galaxy-member")
  }

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
      // GM can only be minted after the user has voted at least once; until they vote we route
      // them to the vote step. Once they've voted, the CTA opens the in-place mint flow.
      cta: hasGM
        ? null
        : hasVotedAllocation
          ? { label: t("Claim NFT"), onClick: handleClaimGM, icon: <LuSparkles /> }
          : { label: t("Vote now"), onClick: goToAllocations, icon: <LuVote /> },
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

  // The card naturally retires when useUserOnboardingPhase flips to "active-voter" (next round
  // after the user claims their first reward). We intentionally DON'T hide on allComplete —
  // the card sticks around for the rest of this round once everything is done.
  if (isPhaseLoading) return null
  if (!isFirstTimeVoter) return null

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
      <GetFreeNFTModal isOpen={getFreeNftModal.open} onClose={getFreeNftModal.onClose} onCtaClick={handleConfirmMint} />
      <MintNFTModal isOpen={mintSuccessModal.open} onClose={handleMintSuccessClose} tokenID={selectedGM?.tokenId} />
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
