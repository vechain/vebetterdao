import { HStack, Text } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"

export const ProposalVotesResults = () => {
  return (
    <HStack>
      <UilExclamationCircle />
      <Text fontSize="14px" color="#6A6A6A">
        Quorum not reached yet
      </Text>
    </HStack>
  )
  return (
    <HStack gap={1}>
      <Text fontSize="14px">The proposal is being</Text>
      <Text fontSize="14px" color="#D23F63">
        rejected
      </Text>
    </HStack>
  )
  return (
    <HStack gap={1}>
      <Text fontSize="14px">The proposal is being</Text>
      <Text fontSize="14px" color="#B59525">
        rejected by abstention
      </Text>
    </HStack>
  )
  return (
    <HStack gap={1}>
      <Text fontSize="14px">The proposal is being</Text>
      <Text fontSize="14px" color="#38BF66">
        approved
      </Text>
    </HStack>
  )
}
