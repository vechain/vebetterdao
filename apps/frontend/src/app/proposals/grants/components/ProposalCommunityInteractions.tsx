import { ProposalState } from "@/hooks/proposals/grants/types"
import { HStack, Icon, Text } from "@chakra-ui/react"
import { UilHeart, UilThumbsUp, UilThumbsDown, UilCircle } from "@iconscout/react-unicons"

export const ProposalCommunityInteractions = ({
  state,
  depositPercentage,
  votesFor,
  votesAgainst,
  votesAbstain,
}: {
  state: ProposalState
  depositPercentage: number
  votesFor: number
  votesAgainst: number
  votesAbstain: number
}) => {
  if (state === ProposalState.Pending) {
    const formattedDepositPercentage = Number(depositPercentage).toFixed(2)
    return (
      <HStack key={depositPercentage} fontSize={{ base: "14px", md: "16px" }} gap={1}>
        <Icon as={UilHeart} />
        <Text>{`${formattedDepositPercentage}%`}</Text>
      </HStack>
    )
  }

  return (
    <>
      <HStack key={votesFor} fontSize={{ base: "14px", md: "16px" }} gap={1}>
        <Icon as={UilThumbsUp} />
        <Text>{`${votesFor}%`}</Text>
      </HStack>
      <HStack key={votesAgainst} fontSize={{ base: "14px", md: "16px" }} gap={1}>
        <Icon as={UilThumbsDown} />
        <Text>{`${votesAgainst}%`}</Text>
      </HStack>
      <HStack key={votesAbstain} fontSize={{ base: "14px", md: "16px" }} gap={1}>
        <Icon as={UilCircle} />
        <Text>{`${votesAbstain}%`}</Text>
      </HStack>
    </>
  )
}
