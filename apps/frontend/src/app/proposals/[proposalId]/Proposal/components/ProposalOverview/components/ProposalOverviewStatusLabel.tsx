import { useCurrentProposal } from "@/api"
import { Circle, HStack, Text, VStack } from "@chakra-ui/react"

export const ProposalOverviewStatusLabel = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.isDepositPending) {
    return (
      <Text fontWeight={"600"} color="#F29B32">
        VOT3 deposit pending
      </Text>
    )
  }
  if (!proposal.isProposalActive) {
    return (
      <Text fontWeight={"600"} color="#6194F5">
        Upcoming voting
      </Text>
    )
  }

  return (
    <HStack bg="#CDFF9F" alignSelf={"flex-start"} px="10px" py="4px" rounded="10px">
      <Circle size="6px" bg="#FC0000" />
      <Text fontSize="14px" color="#3A6F00">
        Active now
      </Text>
    </HStack>
  )
}
