import { useAccountPermissions } from "@/api/contracts/account/hooks"
import { VeBetterIcon } from "@/components/Icons"
import { useBreakpoints } from "@/hooks"
import { Milestone, MilestoneState } from "@/hooks/proposals/grants/types"
import { useApproveMilestone } from "@/hooks/useApproveMilestone"
import { useClaimGrants } from "@/hooks/useClaimGrants"
import { Accordion, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

type MilestonesActionsItemProps = {
  index: number
  state: MilestoneState
  milestone: Milestone
  proposalId: string
  grantsReceiver: string
}

export const MilestonesActionsItem = ({
  index,
  state,
  milestone,
  proposalId,
  grantsReceiver,
}: MilestonesActionsItemProps) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  const { account } = useWallet()
  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  const isGrantReceiver = useMemo(() => {
    return compareAddresses(account?.address, grantsReceiver)
  }, [account?.address, grantsReceiver])

  // Memoize date formatting to avoid recalculation on every render
  const { formattedDates } = useMemo(() => {
    const from = dayjs(milestone.durationFrom * 1000).format("DD MMM, YYYY")
    const to = dayjs(milestone.durationTo * 1000).format("DD MMM, YYYY")
    return {
      formattedDates: { from, to },
    }
  }, [milestone.durationFrom, milestone.durationTo])

  const { sendTransaction: approveGrant } = useApproveMilestone({
    proposalId,
    milestoneIndex: index,
  })

  const { sendTransaction: claimMilestone } = useClaimGrants({
    proposalId,
    milestoneIndex: index,
  })

  // Helper functions for permission checks
  const canApprove = useMemo(() => {
    return permissions?.isGrantApprover && state === MilestoneState.Pending
  }, [permissions?.isGrantApprover, state])

  const canClaim = useMemo(() => {
    return isGrantReceiver && state === MilestoneState.Approved
  }, [isGrantReceiver, state])

  const renderButtons = useMemo(() => {
    // Early return if no actions are available
    if (!canApprove && !canClaim) {
      return null
    }

    // Render approve button for pending milestones
    if (canApprove) {
      return (
        <Button
          size="sm"
          variant="primaryAction"
          onClick={e => {
            e.preventDefault()
            approveGrant()
          }}
          disabled={!permissions?.isGrantApprover}>
          {t("Approve Milestone")}
        </Button>
      )
    }

    // Render claim button for approved milestones
    if (canClaim) {
      return (
        <Button
          size="sm"
          variant="primaryAction"
          onClick={e => {
            e.preventDefault()
            claimMilestone()
          }}
          disabled={!isGrantReceiver}>
          {t("Claim Milestone")}
        </Button>
      )
    }

    return null
  }, [canApprove, canClaim, approveGrant, claimMilestone, permissions?.isGrantApprover, isGrantReceiver, t])

  const content = (
    <VStack py={2} align="flex-start">
      <VStack align="flex-start">
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
        <Text>{`${formattedDates.from} - ${formattedDates.to}`}</Text>
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
        <Heading size="md">{t("Milestone {{milestoneNumber}}", { milestoneNumber: index + 1 })}</Heading>
        {content}
      </VStack>
    )
  }

  return (
    <Accordion.Root
      multiple // allow any item to be open
      defaultValue={[`ms-${index}`]}
      spaceY={10}
      w="full">
      <Accordion.Item value={`ms-${index}`} border="none" w="full" spaceY={10}>
        <Accordion.ItemTrigger w="full" rounded="12px" px="10px" py="8px" _hover={{ bg: "blackAlpha.50" }}>
          <VStack w="full" align="stretch" gap={1}>
            <HStack w="full" justify="space-between">
              <Heading size="md">{t("Milestone {{milestoneNumber}}", { milestoneNumber: index + 1 })}</Heading>
              <Accordion.ItemIndicator />
            </HStack>
          </VStack>
        </Accordion.ItemTrigger>

        <Accordion.ItemContent px="10px" pb="10px">
          {content}
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  )
}
