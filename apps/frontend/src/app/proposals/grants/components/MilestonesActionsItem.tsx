import { Accordion, HStack, Text, VStack, Heading, Button } from "@chakra-ui/react"
import dayjs from "dayjs"
import { Milestone } from "@/hooks/proposals/grants/types"
import { useTranslation } from "react-i18next"
import { useBreakpoints } from "@/hooks"
import { VeBetterIcon } from "@/components/Icons"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useApproveMilestone } from "@/hooks/useApproveMilestone"
import { useClaimGrants } from "@/hooks/useClaimGrants"
import { useAccountPermissions } from "@/api/contracts/account/hooks"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

type MilestonesActionsItemProps = {
  index: number
  state: "Approved" | "Rejected" | "Pending" | "Claimed"
  milestone: Milestone
  proposalId: string
}

export const MilestonesActionsItem = ({ index, state, milestone, proposalId }: MilestonesActionsItemProps) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  const from = dayjs(milestone.durationFrom * 1000).format("DD MMM, YYYY")
  const to = dayjs(milestone.durationTo * 1000).format("DD MMM, YYYY")

  const { sendTransaction: approveGrant } = useApproveMilestone({
    proposalId: proposalId,
    milestoneIndex: index,
  })

  const { sendTransaction: claimMilestone } = useClaimGrants({
    proposalId: proposalId,
    milestoneIndex: index,
  })

  const handleClaimMilestone = () => {
    claimMilestone()
  }

  const handleApproveGrant = () => {
    approveGrant()
  }

  const renderButtons = useMemo(() => {
    switch (state) {
      case "Pending":
        return (
          <Button
            size="sm"
            variant="primaryAction"
            onClick={handleApproveGrant}
            disabled={!permissions?.isGrantApprover}>
            {"Approve Milestone"}
          </Button>
        )
      case "Approved":
        return (
          <Button
            size="sm"
            variant="primaryAction"
            onClick={handleClaimMilestone}
            disabled={!permissions?.isGrantApprover}>
            {"Claim Rewards"}
          </Button>
        )
      default:
        return null
    }
  }, [state, permissions?.isGrantApprover, handleApproveGrant, handleClaimMilestone])

  const content = (
    <VStack py={2} align="flex-start">
      <VStack align="flex-start">
        <Heading size="md">{t("Milestone {{milestoneNumber}}", { milestoneNumber: index + 1 })}</Heading>
        <HStack align="center">
          <VeBetterIcon color="#6A6A6A" size={16} />
          <Text>{t("Amount to Grant")}</Text>
        </HStack>

        <Text>{milestone.fundingAmount.toString()}</Text>
      </VStack>
      <VStack align="flex-start">
        <HStack align="center">
          <Text>{t("Duration")}</Text>
        </HStack>
        <Text>{`${from} - ${to}`}</Text>
      </VStack>
      <VStack align="flex-start">
        <HStack align="center">
          <UilInfoCircle color="#6A6A6A" size={16} />
          <Text>{t("Description")}</Text>
        </HStack>
        <Text>{milestone.description}</Text>
      </VStack>
      {renderButtons}
    </VStack>
  )

  if (!isMobile) {
    return (
      <VStack w="full" align="flex-start" gap={2}>
        {content}
      </VStack>
    )
  }

  return (
    <Accordion.Root collapsible w="full" defaultValue={["first"]}>
      <Accordion.Item value="first" border={"none"} w="full">
        <Accordion.ItemTrigger w="full" rounded={"12px"} px={"8px"} py={0} _hover={{ textDecor: "underline" }}>
          <HStack justify={"space-between"} w="full">
            <Accordion.ItemIndicator />
          </HStack>
        </Accordion.ItemTrigger>
        <Accordion.ItemContent p={"8px"}>{content}</Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  )
}
