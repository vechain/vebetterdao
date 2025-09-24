import { useAccountPermissions } from "@/api/contracts/account"
import B3trIcon from "@/components/Icons/svg/b3tr.svg"
import { GrantProposalEnriched, MilestoneState } from "@/hooks/proposals/grants/types"
import { useApproveMilestone } from "@/hooks/useApproveMilestone"
import { useClaimMilestone } from "@/hooks/useClaimMilestone"
import { useRejectGrant } from "@/hooks/useRejectGrant"
import { Button, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { Calendar } from "iconoir-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

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
}

const MilestoneItemContent = ({ icon, title, value }: { icon: React.ElementType; title: string; value: string }) => (
  <HStack w="full" align="flex-start">
    <Icon as={icon} boxSize={5} color="icon.subtle" />
    <HStack>
      <VStack w="full" align="flex-start">
        <Text fontSize="md" fontWeight={"semibold"}>
          {title}
        </Text>
        <Text fontSize="md" fontWeight={"regular"} lineHeight={"1.5"}>
          {value}
        </Text>
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
}: MilestoneItemProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address)

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
    return account?.address && isGrantApprover && isCurrentStep && milestoneData.state === MilestoneState.Pending
  }, [account?.address, isGrantApprover, isCurrentStep, milestoneData.state])

  // Determine if claim action should show
  const shouldShowClaimAction = useMemo(() => {
    return account?.address && isGrantReceiver && milestoneData.state === MilestoneState.Approved
  }, [account?.address, isGrantReceiver, milestoneData.state])

  return (
    <VStack align="flex-start" gap={"16px"} h="full">
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
        <div>Edit mode</div>
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
            {"Reject"}
          </Button>
          <Button variant="primaryAction" onClick={handleApprove}>
            {"Approve & Fund"}
          </Button>
        </HStack>
      )}

      {/* Grant receiver actions (claim) - available on any approved milestone */}
      {shouldShowClaimAction && (
        <HStack w="full">
          <Button variant="primaryAction" onClick={handleClaim}>
            {"Claim Reward"}
          </Button>
        </HStack>
      )}
    </VStack>
  )
}
