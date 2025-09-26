import { useProposalInteractionDates } from "@/api"
import { useAccountPermissions } from "@/api/contracts/account"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb"
import { useBreakpoints, useProposalEnrichedById } from "@/hooks"
import { ProposalState, ProposalType } from "@/hooks/proposals/grants/types"
import { Grid, GridItem, HStack, Icon, IconButton, Skeleton, Tabs, useDisclosure, VStack } from "@chakra-ui/react"
import { UilShareAlt } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import { ProposalCancelCard } from "./ProposalCancelCard"
import { ProposalCancelModal } from "./ProposalCancelModal"
import { ProposalInteractionCard } from "./ProposalInteractionCard"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalShareModal } from "./ProposalShareModal/ProposalShareModal"
import { ProposalTimeline } from "./ProposalTimeline"
import { ProposalVoteCommentList } from "./ProposalVoteCommentList/ProposalVoteCommentList"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  // ==========================================
  // HOOKS
  // ==========================================
  const { data: proposal, isLoading } = useProposalEnrichedById(proposalId)
  const { onOpen, onClose, open: isOpen } = useDisclosure()
  const { supportEndDate, votingEndDate } = useProposalInteractionDates(proposalId)
  const { onOpen: onOpenCancelModal, onClose: onCloseCancelModal, open: isOpenCancelModal } = useDisclosure()
  const { isMobile } = useBreakpoints()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")
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

  const isVotingPhase = proposal?.state === ProposalState.Active
  const targetDate = isVotingPhase ? votingEndDate : supportEndDate

  const BreadcrumItems = [
    {
      label: isGrant ? "Grants" : "Proposals",
      href: isGrant ? "/proposals/grants" : "/proposals",
    },
    {
      label: "Overview",
      href: `/proposals/${proposalId}`,
    },
  ]

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

  const canCancelProposal = useMemo(() => {
    if (proposal?.state !== ProposalState.Pending) return false
    const isProposer = compareAddresses(proposal?.proposerAddress, account?.address)
    const isAdmin = permissions?.isAdminOfB3TRGovernor
    //Proposal is pending, and either the proposer or the account is the admin
    return proposal?.state === ProposalState.Pending && (isProposer || isAdmin)
  }, [account?.address, permissions?.isAdminOfB3TRGovernor, proposal?.proposerAddress, proposal?.state])

  // ==========================================
  // MEMOIZED COMPONENTS
  // ==========================================
  const memoizedProposalInteractionCard = useMemo(
    () => (
      <ProposalInteractionCard
        proposal={proposal}
        isVotingPhase={isVotingPhase}
        daysLeft={daysLeft}
        hoursLeft={hoursLeft}
        minutesLeft={minutesLeft}
        isLoading={isLoading}
      />
    ),
    [proposal, isVotingPhase, daysLeft, hoursLeft, minutesLeft, isLoading],
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
                <Tabs.Root defaultValue="session" w="full" colorPalette="blue" fitted>
                  <Tabs.List>
                    <Tabs.Trigger
                      value="session"
                      color="text"
                      fontWeight="400"
                      _selected={{
                        color: "#004CFC",
                        fontWeight: "800",
                      }}>
                      {t("Session")}
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="timeline"
                      color="text.subtle"
                      fontWeight="600"
                      _selected={{
                        color: "#004CFC",
                        fontWeight: "800",
                      }}>
                      {t("Timeline")}
                    </Tabs.Trigger>
                  </Tabs.List>
                  <Tabs.Content value="session" pt={6}>
                    <VStack align="stretch" gap={8}>
                      {memoizedProposalInteractionCard}
                      {canCancelProposal && <ProposalCancelCard onOpen={onOpenCancelModal} />}
                    </VStack>
                  </Tabs.Content>
                  <Tabs.Content value="timeline" pt={6}>
                    {memoizedProposalTimeline}
                  </Tabs.Content>
                </Tabs.Root>
              ) : (
                /* Desktop */
                <>
                  {memoizedProposalInteractionCard}
                  {memoizedProposalTimeline}
                  {canCancelProposal && <ProposalCancelCard onOpen={onOpenCancelModal} />}
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

      {/* Cancel Modal */}
      <ProposalCancelModal proposalId={proposalId} isOpen={isOpenCancelModal} onClose={onCloseCancelModal} />
    </>
  )
}
