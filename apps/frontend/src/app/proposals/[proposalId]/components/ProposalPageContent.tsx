import { Box, Grid, GridItem, HStack, Icon, IconButton, Skeleton, Tabs, useDisclosure, VStack } from "@chakra-ui/react"
import { UilShareAlt } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"

import { useIsDepositReached } from "../../../../api/contracts/governance/hooks/useIsDepositReached"
import { useProposalInteractionDates } from "../../../../api/contracts/governance/hooks/useProposalInteractionDates"
import { useProposalUserDeposit } from "../../../../api/contracts/governance/hooks/useProposalUserDeposit"
import { useUserSingleProposalVoteEvent } from "../../../../api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useProposalEnrichedById } from "../../../../hooks/proposals/common/useProposalEnrichedById"
import { useBreakpoints } from "../../../../hooks/useBreakpoints"
import { PageBreadcrumb } from "../../../components/PageBreadcrumb/PageBreadcrumb"

import { B3MOProposalReviewBanner } from "./B3MOProposalReviewBanner/B3MOProposalReviewBanner"
import { ProposalInteractionCard } from "./ProposalInteractionCard/ProposalInteractionCard"
import { ProposalOverview } from "./ProposalOverview/ProposalOverview"
import { ProposalOverviewHeader } from "./ProposalOverviewHeader/ProposalOverviewHeader"
import { ProposalShareModal } from "./ProposalShareModal/ProposalShareModal"
import { ProposalTimeline } from "./ProposalTimeline/ProposalTimeline"
import { ProposalVoteCommentList } from "./ProposalVoteCommentList/ProposalVoteCommentList"

type Props = {
  proposalId: string
  typeFilter?: "proposal" | "grant"
}
export const ProposalPageContent: React.FC<Props> = ({ proposalId, typeFilter }) => {
  // ==========================================
  // HOOKS
  // ==========================================
  const { account } = useWallet()
  const { data: proposal, isLoading } = useProposalEnrichedById(proposalId)
  const { onOpen, onClose, open: isOpen } = useDisclosure()
  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposalId)
  const { data: userDeposits } = useProposalUserDeposit(proposal?.id ?? "", account?.address ?? "")
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposal?.id ?? "")
  const { data: depositReached } = useIsDepositReached(proposal?.id ?? "")
  const { isMobile } = useBreakpoints()
  const { t } = useTranslation()
  const router = useRouter()
  // Ref for throttling countdown calculations
  const lastCountdownCalculationRef = useRef<{
    targetDate: number
    timestamp: number
    result: { daysLeft: number; hoursLeft: number; minutesLeft: number }
  } | null>(null)

  // ==========================================
  // COMPUTED VALUES & CONSTANTS
  // ==========================================
  const isGrant = useMemo(() => {
    return proposal?.type === ProposalType.Grant
  }, [proposal])

  const proposerAddress = proposal?.proposerAddress ?? ""
  const hasUserVoted = !!userVoteEvent?.hasVoted

  const hasUserDeposited = useMemo(() => {
    return BigInt(userDeposits ?? 0) > BigInt(0)
  }, [userDeposits])

  const activeProposal = proposal?.state === ProposalState.Active
  const targetDate = activeProposal ? votingEndDate : supportEndDate

  const overviewHref = isGrant ? `/grants/${proposalId}` : `/proposals/${proposalId}`

  const BreadcrumItems = [
    {
      label: isGrant ? "Grants" : "Proposals",
      href: isGrant ? "/grants" : "/proposals",
    },
    {
      label: "Overview",
      href: overviewHref,
    },
  ]

  useEffect(() => {
    if (isLoading || !proposal || !typeFilter) return

    if (typeFilter === "proposal" && proposal.type === ProposalType.Grant) {
      router.replace(`/grants/${proposalId}`)
    } else if (typeFilter === "grant" && proposal.type !== ProposalType.Grant) {
      router.replace(`/proposals/${proposalId}`)
    }
  }, [isLoading, proposal, proposalId, router, typeFilter])

  const { daysLeft, hoursLeft, minutesLeft } = useMemo(() => {
    if (!targetDate) return { daysLeft: 0, hoursLeft: 0, minutesLeft: 0 }

    const now = Date.now()

    if (
      lastCountdownCalculationRef.current &&
      lastCountdownCalculationRef.current.targetDate === targetDate &&
      now - lastCountdownCalculationRef.current.timestamp < 30000 // 30 seconds
    ) {
      return lastCountdownCalculationRef.current.result
    }

    const nowDayjs = dayjs()
    const target = dayjs(targetDate)

    if (target.isBefore(nowDayjs)) {
      const result = { daysLeft: 0, hoursLeft: 0, minutesLeft: 0 }
      lastCountdownCalculationRef.current = { targetDate, timestamp: now, result }
      return result
    }

    const daysLeft = target.diff(nowDayjs, "days")
    const hoursLeft = target.diff(nowDayjs, "hours") % 24
    const minutesLeft = target.diff(nowDayjs, "minutes") % 60

    const result = {
      daysLeft: Math.max(0, daysLeft),
      hoursLeft: Math.max(0, hoursLeft),
      minutesLeft: Math.max(0, minutesLeft),
    }

    lastCountdownCalculationRef.current = { targetDate, timestamp: now, result }

    return result
  }, [targetDate])

  // ==========================================
  // MEMOIZED COMPONENTS
  // ==========================================
  const memoizedProposalInteractionCard = useMemo(
    () => (
      <ProposalInteractionCard
        proposal={proposal}
        isVotingPhase={activeProposal}
        daysLeft={daysLeft}
        hoursLeft={hoursLeft}
        minutesLeft={minutesLeft}
        isLoading={isLoading}
      />
    ),
    [proposal, activeProposal, daysLeft, hoursLeft, minutesLeft, isLoading],
  )

  const memoizedProposalTimeline = useMemo(() => <ProposalTimeline proposal={proposal} />, [proposal])

  return (
    <>
      <VStack w="full" alignItems="stretch" gap={8}>
        {/* Header Section */}
        <HStack justify="space-between" w="full">
          <PageBreadcrumb items={BreadcrumItems} />
          <IconButton
            aria-label="share"
            bg="transparent"
            borderColor="border.primary"
            boxSize={"40px"}
            onClick={onOpen}>
            <Icon as={UilShareAlt} color="icon.subtle" />
          </IconButton>
        </HStack>

        {/* Main Content Grid */}
        <Grid templateColumns="repeat(3, 1fr)" gap={"40px"} w="full">
          {/* Left/Main Column */}
          <GridItem colSpan={[3, 3, 2]} order={[2, 2, 1]}>
            <Skeleton loading={isLoading}>
              <ProposalOverview isGrant={isGrant} proposal={proposal} />
            </Skeleton>
          </GridItem>

          {/* Right/Sidebar Column */}
          <GridItem colSpan={[3, 3, 1]} order={[1, 1, 2]}>
            <VStack align="stretch" gap={8}>
              {/* Mobile */}
              {isMobile ? (
                <>
                  <VStack align="stretch" gap={0} w="full">
                    {!!proposal && (
                      <ProposalOverviewHeader
                        proposal={proposal}
                        hasUserDeposited={!!hasUserDeposited}
                        hasUserVoted={!!hasUserVoted}
                        depositReached={!!depositReached}
                        proposerAddress={proposerAddress}
                      />
                    )}

                    {/* B3MO Proposal Review Banner - only for standard proposals */}
                    {!isGrant && (
                      <Box mt={{ base: 8, md: 0 }}>
                        <B3MOProposalReviewBanner
                          proposalId={proposalId}
                          status={proposal?.state === ProposalState.Succeeded ? "active" : "pending"}
                        />
                      </Box>
                    )}
                  </VStack>

                  <Tabs.Root defaultValue="session" w="full" fitted>
                    <Tabs.List>
                      <Tabs.Trigger value="session">{t("Session")}</Tabs.Trigger>
                      <Tabs.Trigger value="timeline">{t("Timeline")}</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="session" pt={6}>
                      <VStack align="stretch" gap={8}>
                        {memoizedProposalInteractionCard}
                      </VStack>
                    </Tabs.Content>
                    <Tabs.Content value="timeline" pt={6}>
                      {memoizedProposalTimeline}
                    </Tabs.Content>
                  </Tabs.Root>
                </>
              ) : (
                /* Desktop */
                <>
                  {memoizedProposalInteractionCard}
                  {memoizedProposalTimeline}
                </>
              )}
            </VStack>
          </GridItem>

          {/* Bottom Section */}
          <GridItem colSpan={[3, 3, 2]} order={[2, 2, 3]}>
            <ProposalVoteCommentList proposalId={proposalId} />
          </GridItem>
        </Grid>
      </VStack>

      {/* Share Modal */}
      <ProposalShareModal
        proposalId={proposalId}
        proposalType={proposal?.type ?? ProposalType.Standard}
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
      />
    </>
  )
}
