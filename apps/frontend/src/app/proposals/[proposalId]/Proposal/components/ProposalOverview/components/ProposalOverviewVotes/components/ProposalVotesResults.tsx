import { ProposalState, useCurrentProposal } from "@/api"
import { HStack, Text } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"

export const ProposalVotesResults = () => {
  const { proposal } = useCurrentProposal()

  switch (proposal.state) {
    case ProposalState.Defeated:
      return (
        <HStack gap={1}>
          <Text fontSize="14px">The proposal is being</Text>
          <Text fontSize="14px" color="#D23F63">
            rejected
          </Text>
        </HStack>
      )
    case ProposalState.Succeeded:
      return (
        <HStack gap={1}>
          <Text fontSize="14px">The proposal is being</Text>
          <Text fontSize="14px" color="#38BF66">
            approved
          </Text>
        </HStack>
      )
    case ProposalState.Canceled:
      return (
        <HStack gap={1}>
          <Text fontSize="14px">The proposal is being</Text>
          <Text fontSize="14px" color="#D23F63">
            canceled
          </Text>
        </HStack>
      )
    default:
      return (
        <HStack>
          <UilExclamationCircle />
          <Text fontSize="14px" color="#6A6A6A">
            Quorum not reached yet
          </Text>
        </HStack>
      )
  }
}
