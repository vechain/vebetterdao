import { useCurrentProposal } from "@/api"
import { Circle, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { UilClockEight } from "@iconscout/react-unicons"

export const ProposalOverviewStatusLabel = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.isDepositPending) {
    return (
      <HStack>
        <Image h="20px" w="20px" src="/icons/arm.svg" />
        <Text fontWeight={"600"} color="#F29B32">
          Looking for support
        </Text>
      </HStack>
    )
  }
  if (!proposal.isProposalActive) {
    return (
      <HStack>
        <UilClockEight color="#004CFC" size="20px" />
        <Text fontWeight={"600"} color="#004CFC">
          Waiting for the round to start
        </Text>
      </HStack>
    )
  }

  return (
    <HStack alignSelf={"flex-start"}>
      <Circle size="8px" bg="#F50000" />
      <Text fontWeight={600} color="#6DCB09">
        Active now!
      </Text>
    </HStack>
  )
}
