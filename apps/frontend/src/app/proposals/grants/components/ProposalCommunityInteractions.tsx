import { VoteType } from "@/api"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { HStack, Icon, Text } from "@chakra-ui/react"
import { useMemo } from "react"
import { FaHeart, FaRegHeart, FaRegThumbsDown, FaRegThumbsUp, FaThumbsDown, FaThumbsUp } from "react-icons/fa6"
import { LuCircleSlash2 } from "react-icons/lu"

export const ProposalCommunityInteractions = ({
  proposalId,
  state,
  depositPercentage,
  votesFor,
  votesAgainst,
  votesAbstain,
  hasUserDeposited,
  userVoteOption,
}: {
  proposalId: string
  state: ProposalState
  depositPercentage: number
  votesFor?: number
  votesAgainst?: number
  votesAbstain?: number
  hasUserDeposited?: boolean
  userVoteOption?: VoteType
}) => {
  const { thumbsUpIcon, thumbsDownIcon, circleIcon, forColor, againstColor, abstainColor } = useMemo(() => {
    return {
      thumbsUpIcon: userVoteOption === VoteType.VOTE_FOR ? FaThumbsUp : FaRegThumbsUp,
      thumbsDownIcon: userVoteOption === VoteType.VOTE_AGAINST ? FaThumbsDown : FaRegThumbsDown,
      circleIcon: LuCircleSlash2,
      forColor: userVoteOption === VoteType.VOTE_FOR ? "success.strong" : "text.subtle",
      againstColor: userVoteOption === VoteType.VOTE_AGAINST ? "error.strong" : "text.subtle",
      abstainColor: userVoteOption === VoteType.ABSTAIN ? "warning.strong" : "text.subtle",
    }
  }, [userVoteOption])

  if (state === ProposalState.Pending) {
    const formattedDepositPercentage = Math.floor(Number(depositPercentage))
    const heartIcon = hasUserDeposited ? FaHeart : FaRegHeart
    const heartColor = hasUserDeposited ? "actions.primary.default" : "text.subtle"

    return (
      <HStack
        key={`${proposalId}-depositPercentage`}
        fontSize={{ base: "15px", md: "17px" }}
        gap={1}
        color={heartColor}>
        <Icon as={heartIcon} />
        <Text>{`${formattedDepositPercentage}%`}</Text>
      </HStack>
    )
  }

  return (
    <HStack gap={5}>
      <HStack key={`${proposalId}-votesFor`} fontSize={{ base: "14px", md: "16px" }} gap={1} color={forColor}>
        <Icon as={thumbsUpIcon} />
        <Text>{`${votesFor ?? 0}%`}</Text>
      </HStack>
      <HStack key={`${proposalId}-votesAgainst`} fontSize={{ base: "14px", md: "16px" }} gap={1} color={againstColor}>
        <Icon as={thumbsDownIcon} />
        <Text>{`${votesAgainst ?? 0}%`}</Text>
      </HStack>
      <HStack key={`${proposalId}-votesAbstain`} fontSize={{ base: "14px", md: "16px" }} gap={1} color={abstainColor}>
        <Icon as={circleIcon} fontWeight="bold" />
        <Text>{`${votesAbstain ?? 0}%`}</Text>
      </HStack>
    </HStack>
  )
}
