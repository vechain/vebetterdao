import { HStack, Icon, Text } from "@chakra-ui/react"
import { useMemo } from "react"

import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import HeartSolidIcon from "@/components/Icons/svg/heart-solid.svg"
import HeartIcon from "@/components/Icons/svg/heart.svg"
import ThumbsDownSolidIcon from "@/components/Icons/svg/thumbs-down-solid.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpSolidIcon from "@/components/Icons/svg/thumbs-up-solid.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { ProposalState } from "@/hooks/proposals/grants/types"
import { VoteType } from "@/types/voting"

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
      forColor: userVoteOption === VoteType.VOTE_FOR ? "status.positive.strong" : "icon.subtle",
      againstColor: userVoteOption === VoteType.VOTE_AGAINST ? "status.negative.strong" : "icon.subtle",
      abstainColor: userVoteOption === VoteType.ABSTAIN ? "status.warning.strong" : "icon.subtle",
    }
  }, [userVoteOption])
  if (state === ProposalState.Pending) {
    const formattedDepositPercentage = Math.floor(Number(depositPercentage))
    const heartIcon = hasUserDeposited ? HeartSolidIcon : HeartIcon
    const heartColor = hasUserDeposited ? "actions.primary.default" : "icon.subtle"
    return (
      <HStack key={`${proposalId}-depositPercentage`} textStyle={{ base: "sm", md: "md" }} gap={1} color={heartColor}>
        <Icon as={heartIcon} boxSize={5} />
        <Text>{`${formattedDepositPercentage}%`}</Text>
      </HStack>
    )
  }

  return (
    <HStack gap={{ base: "2", md: "4" }}>
      <HStack key={`${proposalId}-votesFor`} gap={1}>
        <Icon as={thumbsUpIcon} boxSize={5} color={forColor} />
        <Text textStyle={{ base: "sm", md: "md" }} color={forColor}>{`${Math.floor(votesFor ?? 0)}%`}</Text>
      </HStack>
      <HStack key={`${proposalId}-votesAgainst`} gap={1}>
        <Icon as={thumbsDownIcon} boxSize={5} color={againstColor} />
        <Text textStyle={{ base: "sm", md: "md" }} color={againstColor}>{`${Math.floor(votesAgainst ?? 0)}%`}</Text>
      </HStack>
      <HStack key={`${proposalId}-votesAbstain`} gap={1}>
        <Icon as={circleIcon} fontWeight="bold" boxSize={5} color={abstainColor} />
        <Text textStyle={{ base: "sm", md: "md" }} color={abstainColor}>{`${Math.floor(votesAbstain ?? 0)}%`}</Text>
      </HStack>
    </HStack>
  )
}
