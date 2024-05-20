import { ProposalState, useCurrentProposal } from "@/api"
import { timestampToTimeLeftCompact } from "@/utils"
import { HStack, Text, VStack } from "@chakra-ui/react"
import { UilClockEight } from "@iconscout/react-unicons"

export const ProposalOverviewTime = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.isStateLoading) return null

  switch (proposal.state) {
    case ProposalState.Succeeded:
      return (
        <VStack alignItems={"stretch"}>
          <Text fontWeight={"400"}>Finished</Text>
          <HStack>
            <UilClockEight />
            <Text>{timestampToTimeLeftCompact(proposal.votingEndDate)} ago</Text>
          </HStack>
        </VStack>
      )

    case ProposalState.Pending:
      if (proposal.isDepositReached) {
        return (
          <VStack alignItems={"stretch"}>
            <Text fontWeight={"400"} color="#6A6A6A">
              Starts in
            </Text>
            <HStack color="#004CFC">
              <UilClockEight size="20px" />
              <Text fontWeight={600}>{timestampToTimeLeftCompact(proposal.votingStartDate)}</Text>
            </HStack>
          </VStack>
        )
      }
      return (
        <VStack alignItems={"stretch"}>
          <Text fontWeight={"400"}>Starts in</Text>
          <HStack>
            <UilClockEight size="20px" />
            <Text fontWeight={600}>{timestampToTimeLeftCompact(proposal.votingStartDate)}</Text>
          </HStack>
        </VStack>
      )
    case ProposalState.Active:
      return (
        <VStack alignItems={"stretch"}>
          <Text fontWeight={"400"} color="#6A6A6A">
            Finish in
          </Text>
          <HStack>
            <UilClockEight />
            <Text color="#252525">{timestampToTimeLeftCompact(proposal.votingEndDate)}</Text>
          </HStack>
        </VStack>
      )
    default:
      return null
  }
}
