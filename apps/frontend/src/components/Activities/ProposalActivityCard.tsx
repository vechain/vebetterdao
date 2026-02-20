import { Text, Card, VStack, HStack, Icon, LinkBox, LinkOverlay } from "@chakra-ui/react"
import dayjs from "dayjs"
import NextLink from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"
import { FaRegCircleCheck, FaRegCircleXmark } from "react-icons/fa6"
import { GoRocket } from "react-icons/go"
import { LuSearch } from "react-icons/lu"

import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

import { useProposalVotes } from "../../api/indexer/proposals/useProposalVotes"

type Props = {
  activity: ActivityItem & {
    type:
      | ActivityType.PROPOSAL_CANCELLED
      | ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT
      | ActivityType.PROPOSAL_IN_DEVELOPMENT
      | ActivityType.PROPOSAL_EXECUTED
      | ActivityType.PROPOSAL_VOTED_FOR
      | ActivityType.PROPOSAL_VOTED_AGAINST
      | ActivityType.PROPOSAL_QUORUM_NOT_REACHED
      | ActivityType.PROPOSAL_SUPPORT_NOT_REACHED
      | ActivityType.PROPOSAL_SUPPORTED
  }
}

const VOTING_OUTCOME_TYPES = new Set<ActivityType>([
  ActivityType.PROPOSAL_VOTED_FOR,
  ActivityType.PROPOSAL_VOTED_AGAINST,
  ActivityType.PROPOSAL_QUORUM_NOT_REACHED,
])

const getIcon = (type: Props["activity"]["type"]) => {
  switch (type) {
    case ActivityType.PROPOSAL_VOTED_FOR:
    case ActivityType.PROPOSAL_SUPPORTED:
      return { icon: FaRegCircleCheck, color: "status.positive.strong" }
    case ActivityType.PROPOSAL_EXECUTED:
    case ActivityType.PROPOSAL_IN_DEVELOPMENT:
      return { icon: GoRocket, color: "status.info.strong" }
    case ActivityType.PROPOSAL_VOTED_AGAINST:
    case ActivityType.PROPOSAL_CANCELLED:
    case ActivityType.PROPOSAL_QUORUM_NOT_REACHED:
    case ActivityType.PROPOSAL_SUPPORT_NOT_REACHED:
      return { icon: FaRegCircleXmark, color: "status.negative.strong" }
    case ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT:
      return { icon: LuSearch, color: "status.warning.strong" }
  }
}

const getTitle = (type: Props["activity"]["type"], t: (key: string) => string) => {
  switch (type) {
    case ActivityType.PROPOSAL_VOTED_FOR:
      return t("Proposal passed")
    case ActivityType.PROPOSAL_VOTED_AGAINST:
      return t("Proposal rejected")
    case ActivityType.PROPOSAL_CANCELLED:
      return t("Proposal cancelled")
    case ActivityType.PROPOSAL_QUORUM_NOT_REACHED:
      return t("Quorum not reached")
    case ActivityType.PROPOSAL_SUPPORT_NOT_REACHED:
      return t("Support not reached")
    case ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT:
      return t("Looking for support")
    case ActivityType.PROPOSAL_SUPPORTED:
      return t("Proposal reached support threshold")
    case ActivityType.PROPOSAL_IN_DEVELOPMENT:
      return t("Proposal in development")
    case ActivityType.PROPOSAL_EXECUTED:
      return t("Proposal executed")
  }
}

const VoteStats: React.FC<{ proposalId: string }> = ({ proposalId }) => {
  const { data: proposalVotes } = useProposalVotes(proposalId)

  if (!proposalVotes) return null

  const votesFor = Math.floor(proposalVotes.votes?.for?.percentagePower ?? 0)
  const votesAgainst = Math.floor(proposalVotes.votes?.against?.percentagePower ?? 0)
  const votesAbstain = Math.floor(proposalVotes.votes?.abstain?.percentagePower ?? 0)

  return (
    <HStack gap="3" pl="8">
      <HStack gap={1}>
        <Icon as={ThumbsUpIcon} boxSize={4} color="icon.subtle" />
        <Text textStyle="sm" color="icon.subtle">{`${votesFor}%`}</Text>
      </HStack>
      <HStack gap={1}>
        <Icon as={ThumbsDownIcon} boxSize={4} color="icon.subtle" />
        <Text textStyle="sm" color="icon.subtle">{`${votesAgainst}%`}</Text>
      </HStack>
      <HStack gap={1}>
        <Icon as={AbstainIcon} boxSize={4} color="icon.subtle" />
        <Text textStyle="sm" color="icon.subtle">{`${votesAbstain}%`}</Text>
      </HStack>
    </HStack>
  )
}

export const ProposalActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { icon, color } = getIcon(activity.type)
  const showVoteStats = VOTING_OUTCOME_TYPES.has(activity.type)

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={icon} color={color} boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay asChild>
                  <NextLink href={`/proposals/${activity.metadata.proposalId}`}>
                    <Text textStyle="sm" fontWeight="bold">
                      {getTitle(activity.type, t)}
                    </Text>
                  </NextLink>
                </LinkOverlay>
                <Text textStyle="sm" color="text.subtle">
                  {activity.metadata.proposalTitle}
                </Text>
              </VStack>

              <Text textStyle="xs" color="text.subtle">
                {dayjs.unix(activity.date).fromNow()}
              </Text>
            </HStack>
            {showVoteStats && <VoteStats proposalId={activity.metadata.proposalId} />}
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
