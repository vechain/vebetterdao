import { useCurrentProposal } from "@/api"
import { timestampToTimeLeftCompact } from "@/utils"
import { HStack, Text, VStack } from "@chakra-ui/react"
import { UilClockEight } from "@iconscout/react-unicons"

export const ProposalOverviewTime = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.isDepositPending) {
    return (
      <VStack alignItems={"stretch"}>
        <Text fontWeight={"400"}>Starts in</Text>
        <HStack>
          <UilClockEight />
          <Text>{timestampToTimeLeftCompact(proposal.startDate)}</Text>
        </HStack>
      </VStack>
    )
  }
  if (!proposal.isProposalActive) {
    return (
      <VStack alignItems={"stretch"}>
        <Text fontWeight={"400"} color="#6A6A6A">
          Starts in
        </Text>
        <HStack color="#004CFC">
          <UilClockEight size="20px" />
          <Text fontWeight={600}>{timestampToTimeLeftCompact(proposal.startDate)}</Text>
        </HStack>
      </VStack>
    )
  }

  return (
    <VStack alignItems={"stretch"}>
      <Text fontWeight={"400"} color="#6A6A6A">
        Finish in
      </Text>
      <HStack>
        <UilClockEight />
        <Text color="#252525">{timestampToTimeLeftCompact(proposal.endDate)}</Text>
      </HStack>
    </VStack>
  )
}
