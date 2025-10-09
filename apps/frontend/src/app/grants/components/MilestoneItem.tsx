import { Button, Field, HStack, Icon, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { Calendar } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { DatePicker } from "../../../components/DatePicker/DatePicker"
import { useAccountPermissions } from "../../../api/contracts/account/hooks/useAccountPermissions"

import { useRejectGrant } from "@/hooks/useRejectGrant"
import { useClaimMilestone } from "@/hooks/useClaimMilestone"
import { useApproveMilestone } from "@/hooks/useApproveMilestone"
import { GrantProposalEnriched, MilestoneState, ProposalState } from "@/hooks/proposals/grants/types"
import B3trIcon from "@/components/Icons/svg/b3tr.svg"

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
  mode?: "read" | "edit"
  onDateChange: (durationFrom: string, durationTo: string) => void
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
  mode = "read",
  onDateChange,
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

      {/* Reviewer actions (approve/reject) - only on current pending milestone */}
      {shouldShowReviewerActions && (
        <HStack w="full">
          <Button variant="secondary" onClick={handleReject}>
            {t("Reject")}
          </Button>
          <Button variant="primary" onClick={handleApprove}>
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
    </VStack>
  )
}
