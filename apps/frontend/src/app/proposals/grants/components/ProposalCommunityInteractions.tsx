import { VoteType } from "@/api"
import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import HeartSolidIcon from "@/components/Icons/svg/heart-solid.svg"
import HeartIcon from "@/components/Icons/svg/heart.svg"
import ThumbsDownSolidIcon from "@/components/Icons/svg/thumbs-down-solid.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpSolidIcon from "@/components/Icons/svg/thumbs-up-solid.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { HStack, Icon, Text } from "@chakra-ui/react"
import { useMemo } from "react"

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
      thumbsUpIcon: userVoteOption === VoteType.VOTE_FOR ? ThumbsUpSolidIcon : ThumbsUpIcon,
      thumbsDownIcon: userVoteOption === VoteType.VOTE_AGAINST ? ThumbsDownSolidIcon : ThumbsDownIcon,
      circleIcon: AbstainIcon,
      forColor: userVoteOption === VoteType.VOTE_FOR ? "success.strong" : "icon.subtle",
      againstColor: userVoteOption === VoteType.VOTE_AGAINST ? "error.strong" : "icon.subtle",
      abstainColor: userVoteOption === VoteType.ABSTAIN ? "warning.strong" : "icon.subtle",
    }
  }, [userVoteOption])

  if (state === ProposalState.Pending) {
    const formattedDepositPercentage = Math.floor(Number(depositPercentage))
    const heartIcon = hasUserDeposited ? HeartSolidIcon : HeartIcon
    const heartColor = hasUserDeposited ? "actions.primary.default" : "icon.subtle"

    return (
      <HStack
        key={`${proposalId}-depositPercentage`}
        fontSize={{ base: "15px", md: "17px" }}
        gap={1}
        color={heartColor}>
        <Icon as={heartIcon} boxSize={5} />
        <Text>{`${formattedDepositPercentage}%`}</Text>
      </HStack>
    )
  }

  return (
    <HStack gap={5}>
      <HStack key={`${proposalId}-votesFor`} fontSize={{ base: "14px", md: "16px" }} gap={1} color={forColor}>
        <Icon as={thumbsUpIcon} boxSize={5} />
        <Text>{`${Math.floor(votesFor ?? 0)}%`}</Text>
      </HStack>
      <HStack key={`${proposalId}-votesAgainst`} fontSize={{ base: "14px", md: "16px" }} gap={1} color={againstColor}>
        <Icon as={thumbsDownIcon} boxSize={5} />
        <Text>{`${Math.floor(votesAgainst ?? 0)}%`}</Text>
      </HStack>
      <HStack key={`${proposalId}-votesAbstain`} fontSize={{ base: "14px", md: "16px" }} gap={1} color={abstainColor}>
        <Icon as={circleIcon} fontWeight="bold" boxSize={5} />
        <Text>{`${Math.floor(votesAbstain ?? 0)}%`}</Text>
      </HStack>
    </HStack>
  )
}
