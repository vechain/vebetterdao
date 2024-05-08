import { useCurrentProposal } from "@/api"
import { timestampToTimeLeftCompact } from "@/utils"
import { Circle, HStack, Text, VStack } from "@chakra-ui/react"
import { FaRegClock } from "react-icons/fa6"

export const ProposalOverviewTime = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.isDepositPending) {
    return (
      <VStack alignItems={"stretch"}>
        <Text fontWeight={"400"}>Starts in</Text>
        <HStack>
          <FaRegClock />
          <Text color="#6194F5">{timestampToTimeLeftCompact(proposal.startDate)}</Text>
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
        <HStack color="#6194F5">
          <FaRegClock />
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
        <FaRegClock />
        <Text color="#252525">{timestampToTimeLeftCompact(proposal.startDate)}</Text>
      </HStack>
    </VStack>
  )
}
