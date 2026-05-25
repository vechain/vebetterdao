import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Icon,
  Portal,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { Calendar } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import B3trIcon from "@/components/Icons/svg/b3tr.svg"
import { ExpenditureReport, GrantProposalEnriched, MilestoneState, ProposalState } from "@/hooks/proposals/grants/types"
import { useApproveMilestone } from "@/hooks/useApproveMilestone"
import { useClaimMilestone } from "@/hooks/useClaimMilestone"
import { useRejectGrant } from "@/hooks/useRejectGrant"

import { useAccountPermissions } from "../../../api/contracts/account/hooks/useAccountPermissions"
import { DatePicker } from "../../../components/DatePicker/DatePicker"
import { GenericAlert } from "../../components/Alert/GenericAlert"

import { ExpenditureReportForm } from "./ExpenditureReportForm"
import { ExpenditureReportView } from "./ExpenditureReportView"

type MilestoneWithState = {
  milestone?: {
    fundingAmount: number
    durationFrom: number
    durationTo: number
    description: string
  }
  state: MilestoneState
  index: number
  mode?: "read" | "edit"
}
type MilestoneItemProps = {
  milestoneData: MilestoneWithState
  proposal: GrantProposalEnriched
  isCurrentStep: boolean
  milestoneIndex: number
  totalMilestones: number
  mode?: "read" | "edit"
  onDateChange: (durationFrom: string, durationTo: string) => void
  /** Tranche-keyed expenditure report for this milestone, if one has been submitted. */
  expenditureReport?: ExpenditureReport
  /** Whether the connected wallet is allowed to submit/update reports (proposer / receiver / approver). */
  canSubmitExpenditureReport: boolean
  /** True when this milestone's inline ExpenditureReportForm is the one currently open. */
  isReportFormOpen: boolean
  isPublishingReport: boolean
  onOpenReportForm: () => void
  onCancelReportForm: () => void
  onSubmitReport: (report: ExpenditureReport) => Promise<void>
}
const MilestoneItemContent = ({ icon, title, value }: { icon: React.ElementType; title: string; value?: string }) => (
  <HStack w="full" align="flex">
    <Icon as={icon} boxSize={4} color="icon.subtle" />
    <HStack w="full">
      <VStack w="full" align="flex-start">
        <Text textStyle="sm" fontWeight={"semibold"}>
          {title}
        </Text>
        {value && (
          <Text
            w="full"
            textStyle="sm"
            fontWeight={"regular"}
            lineHeight={"1.5"}
            wordBreak="break-word"
            overflowWrap="break-word"
            whiteSpace="pre-wrap">
            {value}
          </Text>
        )}
      </VStack>
    </HStack>
  </HStack>
)

export const MilestoneItem = ({
  milestoneData,
  proposal,
  isCurrentStep,
  milestoneIndex,
  totalMilestones,
  mode = "read",
  onDateChange,
  expenditureReport,
  canSubmitExpenditureReport,
  isReportFormOpen,
  isPublishingReport,
  onOpenReportForm,
  onCancelReportForm,
  onSubmitReport,
}: MilestoneItemProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address)

  const [duration, setDuration] = useState<{ from: string; to: string }>({
    from: milestoneData.milestone?.durationFrom
      ? dayjs(milestoneData.milestone?.durationFrom * 1000).format("YYYY-MM-DD")
      : "",
    to: milestoneData.milestone?.durationTo
      ? dayjs(milestoneData.milestone?.durationTo * 1000).format("YYYY-MM-DD")
      : "",
  })
  const [overrideMissingReport, setOverrideMissingReport] = useState(false)

  // Hooks with proper milestone context
  const { sendTransaction: approveMilestone, resetStatus: resetApproveMilestone } = useApproveMilestone({
    proposalId: proposal.id,
    milestoneIndex,
  })
  const { sendTransaction: rejectMilestone, resetStatus: resetRejectMilestone } = useRejectGrant({
    proposalId: proposal.id,
  })
  const { sendTransaction: claimMilestone, resetStatus: resetClaimMilestone } = useClaimMilestone({
    proposalId: proposal.id,
    milestoneIndex,
  })

  // User permissions and roles
  const isGrantReceiver = useMemo(() => {
    return account?.address && proposal.grantsReceiverAddress
      ? compareAddresses(account.address, proposal.grantsReceiverAddress)
      : false
  }, [account?.address, proposal.grantsReceiverAddress])

  const isGrantApprover = useMemo(() => {
    return permissions?.isGrantApprover ?? false
  }, [permissions?.isGrantApprover])

  // Format duration
  const formatDuration = (durationFrom: number, durationTo: number) => {
    const from = dayjs(durationFrom * 1000).format("MMM D, YYYY")
    const to = dayjs(durationTo * 1000).format("MMM D, YYYY")
    return `${from} - ${to}`
  }

  // Action handlers - specific and simple
  const handleApprove = () => {
    resetApproveMilestone()
    resetRejectMilestone()
    resetClaimMilestone()
    approveMilestone()
  }

  const handleReject = () => {
    resetApproveMilestone()
    resetRejectMilestone()
    resetClaimMilestone()
    rejectMilestone()
  }

  const handleClaim = () => {
    resetApproveMilestone()
    resetRejectMilestone()
    resetClaimMilestone()
    claimMilestone()
  }

  // Determine if reviewer actions should show
  const shouldShowReviewerActions = useMemo(() => {
    return (
      account?.address &&
      isGrantApprover &&
      isCurrentStep &&
      milestoneData.state === MilestoneState.Pending &&
      proposal.state === ProposalState.InDevelopment
    )
  }, [account?.address, isGrantApprover, isCurrentStep, milestoneData.state, proposal.state])

  const hasTrancheExpenditureReport = !!expenditureReport

  /**
   * Anyone viewing the current funding milestone sees a warning when no on-chain expenditure
   * report exists yet — covers both the pre-approval (Pending) and pre-claim (Approved) windows.
   */
  const shouldWarnMissingExpenditureReport =
    isCurrentStep &&
    !hasTrancheExpenditureReport &&
    proposal.state === ProposalState.InDevelopment &&
    (milestoneData.state === MilestoneState.Pending || milestoneData.state === MilestoneState.Approved)

  /** Approver's Approve & Fund button stays gated by override on the missing-report case. */
  const shouldGateReviewerApproval = shouldShowReviewerActions && !hasTrancheExpenditureReport

  // Determine if claim action should show
  const shouldShowClaimAction = useMemo(() => {
    return account?.address && isGrantReceiver && milestoneData.state === MilestoneState.Approved
  }, [account?.address, isGrantReceiver, milestoneData.state])

  return (
    <VStack align="flex-start" gap={4} h="full">
      <MilestoneItemContent
        icon={B3trIcon}
        title={t("Amount to grant")}
        value={humanNumber(
          milestoneData.milestone?.fundingAmount ?? 0,
          milestoneData.milestone?.fundingAmount ?? 0,
          "B3TR",
        )}
      />
      {mode === "read" ? (
        <MilestoneItemContent
          icon={Calendar}
          title={t("Duration")}
          value={formatDuration(milestoneData.milestone?.durationFrom ?? 0, milestoneData.milestone?.durationTo ?? 0)}
        />
      ) : (
        <VStack w="full" gap={2}>
          <MilestoneItemContent icon={Calendar} title={t("Duration")} />

          <SimpleGrid w="full" columns={{ base: 1, md: 2 }} gap={4}>
            <Field.Root display="flex" flexDirection="column" gap={2} alignItems="stretch">
              <Field.Label>{t("From")}</Field.Label>
              <DatePicker
                variant="single"
                startDate={duration.from}
                placeholder={
                  milestoneData.milestone?.durationFrom
                    ? dayjs(milestoneData.milestone?.durationFrom * 1000).format("DD/MM/YYYY")
                    : ""
                }
                onChange={from => {
                  setDuration({ ...duration, from })
                  onDateChange(from, duration.to)
                }}
                value={duration.from}
              />
            </Field.Root>
            <Field.Root display="flex" flexDirection="column" gap={2} alignItems="stretch">
              <Field.Label>{t("To")}</Field.Label>
              <DatePicker
                variant="single"
                startDate={duration.to}
                placeholder={
                  milestoneData.milestone?.durationTo
                    ? dayjs(milestoneData.milestone?.durationTo * 1000).format("DD/MM/YYYY")
                    : ""
                }
                onChange={to => {
                  setDuration({ ...duration, to })
                  onDateChange(duration.from, to)
                }}
                value={duration.to}
              />
            </Field.Root>
          </SimpleGrid>
        </VStack>
      )}
      <MilestoneItemContent
        icon={UilInfoCircle}
        title={t("Description")}
        value={milestoneData.milestone?.description ?? ""}
      />

      {/* Missing-report warning — visible to anyone on the current milestone (proposer/approver/receiver). */}
      {shouldWarnMissingExpenditureReport && (
        <VStack align="flex-start" w="full" gap={3}>
          <GenericAlert
            type="warning"
            isLoading={false}
            title={t("Expenditure report missing for this payout")}
            message={t(
              "No standardized expenditure report for this funding milestone is recorded on chain. Confirm before approving funds.",
            )}
          />
          {/* Approver-only override — required to enable Approve & Fund when no report exists. */}
          {shouldGateReviewerApproval && (
            <Checkbox.Root
              size="md"
              checked={overrideMissingReport}
              onCheckedChange={({ checked }) => setOverrideMissingReport(Boolean(checked))}>
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                <Text textStyle="sm">{t("Ignore missing report warning and send anyway")}</Text>
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        </VStack>
      )}
      {shouldShowReviewerActions && (
        <HStack w="full">
          <Button variant="secondary" colorPalette="red" onClick={handleReject}>
            {t("Reject")}
          </Button>
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={Boolean(shouldGateReviewerApproval) && !overrideMissingReport}>
            {t("Approve & Fund")}
          </Button>
        </HStack>
      )}

      {/* Grant receiver actions (claim) - available on any approved milestone */}
      {shouldShowClaimAction && (
        <HStack w="full">
          <Button variant="primary" onClick={handleClaim}>
            {t("Claim Reward")}
          </Button>
        </HStack>
      )}

      {/* Per-milestone expenditure report: read-only history if a report exists, edit CTA opens a modal form. */}
      {expenditureReport && (
        <VStack w="full" p={4} borderWidth="1px" borderRadius="xl" borderColor="border.primary" align="stretch">
          <ExpenditureReportView report={expenditureReport} />
        </VStack>
      )}
      {canSubmitExpenditureReport && isCurrentStep && (
        <Button variant="secondary" size="sm" onClick={onOpenReportForm}>
          {expenditureReport ? t("Update expenditure report") : t("Submit expenditure report")}
        </Button>
      )}

      <Dialog.Root
        open={isReportFormOpen}
        onOpenChange={e => {
          if (!e.open) onCancelReportForm()
        }}
        size={{ base: "full", md: "lg" }}
        scrollBehavior="inside">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Body p={{ base: 4, md: 6 }}>
                <ExpenditureReportForm
                  proposal={proposal}
                  currentMilestoneIndex={milestoneIndex}
                  totalMilestones={totalMilestones}
                  onSubmit={onSubmitReport}
                  onCancel={onCancelReportForm}
                  isSubmitting={isPublishingReport}
                />
              </Dialog.Body>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </VStack>
  )
}
