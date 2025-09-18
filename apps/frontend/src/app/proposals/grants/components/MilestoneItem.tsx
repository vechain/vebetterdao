import { HStack, Icon, Text, VStack } from "@chakra-ui/react"

type MilestoneItemProps = {
  index: number
  icon: React.ElementType
  title: string
  value: string
}

export const MilestoneItem = ({ icon, title, value }: MilestoneItemProps) => {
  return (
    <HStack w="full" align="flex-start">
      <Icon as={icon} boxSize={5} color="icon.subtle" />
      <HStack>
        <VStack w="full" align="flex-start" color="text.subtle">
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
}

// const { data: permissions } = useAccountPermissions(account?.address ?? "")

// const isGrantReceiver = useMemo(() => {
//   return compareAddresses(account?.address, grantsReceiver)
// }, [account?.address, grantsReceiver])

// // Memoize date formatting to avoid recalculation on every render
// const { formattedDates } = useMemo(() => {
//   const from = dayjs(milestone.durationFrom * 1000).format("DD MMM, YYYY")
//   const to = dayjs(milestone.durationTo * 1000).format("DD MMM, YYYY")
//   return {
//     formattedDates: { from, to },
//   }
// }, [milestone.durationFrom, milestone.durationTo])

// const { sendTransaction: approveGrant } = useApproveMilestone({
//   proposalId,
//   milestoneIndex: index,
// })

// const { sendTransaction: claimMilestone } = useClaimGrants({
//   proposalId,
//   milestoneIndex: index,
// })

// // Helper functions for permission checks
// const canApprove = useMemo(() => {
//   return permissions?.isGrantApprover && state === MilestoneState.Pending
// }, [permissions?.isGrantApprover, state])

// const canClaim = useMemo(() => {
//   return isGrantReceiver && state === MilestoneState.Approved
// }, [isGrantReceiver, state])

// const renderButtons = useMemo(() => {
//   // Early return if no actions are available
//   if (!canApprove && !canClaim) {
//     return null
//   }

//   // Render approve button for pending milestones
//   if (canApprove) {
//     return (
//       <Button
//         size="sm"
//         variant="primaryAction"
//         onClick={e => {
//           e.preventDefault()
//           approveGrant()
//         }}
//         disabled={!permissions?.isGrantApprover}>
//         {t("Approve Milestone")}
//       </Button>
//     )
//   }

//   // Render claim button for approved milestones
//   if (canClaim) {
//     return (
//       <Button
//         size="sm"
//         variant="primaryAction"
//         onClick={e => {
//           e.preventDefault()
//           claimMilestone()
//         }}
//         disabled={!isGrantReceiver}>
//         {t("Claim Milestone")}
//       </Button>
//     )
//   }

//   return null
// }, [canApprove, canClaim, approveGrant, claimMilestone, permissions?.isGrantApprover, isGrantReceiver, t])

// const content = (
//   <VStack py={2} align="flex-start">
//     <VStack align="flex-start">
//       <HStack align="center">
//         <VeBetterIcon color="#6A6A6A" size={16} />
//         <Text>{t("Amount to Grant")}</Text>
//       </HStack>

//       <Text>{milestone.fundingAmount.toString()}</Text>
//     </VStack>
//     <VStack align="flex-start">
//       <HStack align="center">
//         <Text>{t("Duration")}</Text>
//       </HStack>
//       <Text>{`${formattedDates.from} - ${formattedDates.to}`}</Text>
//     </VStack>
//     <VStack align="flex-start">
//       <HStack align="center">
//         <UilInfoCircle color="#6A6A6A" size={16} />
//         <Text>{t("Description")}</Text>
//       </HStack>
//       <Text>{milestone.description}</Text>
//     </VStack>
//     {renderButtons}
//   </VStack>
// )

// if (!isMobile) {
//   return (
//     <VStack w="full" align="flex-start" gap={2}>
//       <Heading size="md">{t("Milestone {{milestoneNumber}}", { milestoneNumber: index + 1 })}</Heading>
//       {content}
//     </VStack>
//   )
// }
