import { ProposalState, useCurrentProposal } from "@/api"
import { Arm } from "@/components/Icons/Arm"
import { Circle, HStack, Text } from "@chakra-ui/react"
import { UilCheck, UilClockEight, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"

export const ProposalOverviewStatusLabel = () => {
  const { proposal } = useCurrentProposal()

  switch (proposal.state) {
    case ProposalState.Succeeded:
      return (
        <HStack>
          <Arm color="#6DCB09" />
          <Text fontWeight={"600"} color="#6DCB09">
            Approved
          </Text>
        </HStack>
      )
    case ProposalState.Canceled:
      return (
        <Text fontWeight={"600"} color="#D23F63">
          Canceled
        </Text>
      )
    case ProposalState.DepositNotMet:
      return (
        <HStack>
          <Arm color="#D23F63" />
          <Text fontWeight={"600"} color="#D23F63">
            Canceled due lack of support
          </Text>
        </HStack>
      )
    case ProposalState.Pending:
      if (proposal.isDepositReached) {
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
        <HStack>
          <Arm />
          <Text fontWeight={"600"} color="#F29B32">
            Looking for support
          </Text>
        </HStack>
      )

    case ProposalState.Active:
      return (
        <HStack alignSelf={"flex-start"}>
          <Circle size="8px" bg="#F50000" />
          <Text fontWeight={600} color="#6DCB09">
            Active now!
          </Text>
        </HStack>
      )

    case ProposalState.Defeated:
      return (
        <HStack>
          <UilThumbsDown color="#D23F63" size="20px" />
          <Text fontWeight={"600"} color="#D23F63">
            Ended and rejected
          </Text>
        </HStack>
      )
    case ProposalState.Queued:
      return (
        <HStack rounded={"12px"} bgColor={"#EBF1FE"} px="10px" py="2px">
          <UilThumbsUp color="#004CFC" size="20px" />
          <Text fontWeight={"600"} color="#004CFC">
            Ended and queued
          </Text>
        </HStack>
      )
    case ProposalState.Executed:
      return (
        <HStack rounded={"12px"} bgColor={"#E9FDF1"} px="10px" py="2px">
          <UilCheck color="#38BF66" size="20px" />
          <Text fontWeight={"600"} color="#38BF66">
            Ended and executed
          </Text>
        </HStack>
      )
    default:
      return null
  }
}
