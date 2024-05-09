import { ProposalState, useCurrentProposal } from "@/api"
import { Arm } from "@/components/Icons/Arm"
import { Circle, HStack, Text } from "@chakra-ui/react"
import { UilClockEight } from "@iconscout/react-unicons"

export const ProposalOverviewStatusLabel = () => {
  const { proposal } = useCurrentProposal()

  if (proposal.state === ProposalState.DepositNotMet) {
    return (
      <HStack>
        <Arm />
        <Text fontWeight={"600"} color="#F29B32">
          Looking for support
        </Text>
      </HStack>
    )
  }
  if (proposal.state === ProposalState.Defeated) {
    return (
      <HStack>
        <Arm color="#D23F63" />
        <Text fontWeight={"600"} color="#D23F63">
          Canceled due lack of support
        </Text>
      </HStack>
    )
  }
  if (proposal.state === ProposalState.Pending) {
    return (
      <HStack>
        <UilClockEight color="#004CFC" size="20px" />
        <Text fontWeight={"600"} color="#004CFC">
          Waiting for the round to start
        </Text>
      </HStack>
    )
  }

  if (proposal.state === ProposalState.Active) {
    return (
      <HStack alignSelf={"flex-start"}>
        <Circle size="8px" bg="#F50000" />
        <Text fontWeight={600} color="#6DCB09">
          Active now!
        </Text>
      </HStack>
    )
  }
}
