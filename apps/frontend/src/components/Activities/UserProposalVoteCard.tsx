import { Text, Card, VStack, HStack, Icon, LinkBox, LinkOverlay } from "@chakra-ui/react"
import dayjs from "dayjs"
import { DesignNibSolid } from "iconoir-react"
import NextLink, { type LinkProps } from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const TypedNextLink = NextLink as React.FC<React.PropsWithChildren<LinkProps>>

type Props = {
  activity: ActivityItem & { type: ActivityType.USER_PROPOSAL_VOTE_CAST }
}

const getVoteChoice = (support: number, t: ReturnType<typeof useTranslation>["t"]) => {
  switch (support) {
    case 1:
      return t("for")
    case 0:
      return t("against")
    default:
      return t("abstain")
  }
}

export const UserProposalVoteCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { proposalId, proposalTitle, support, proposalType } = activity.metadata

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <HStack gap="3" align="flex-start" w="full">
            <Icon as={DesignNibSolid} color="status.neutral.strong" boxSize="5" mt="0.5" flexShrink={0} />
            <VStack gap="1" align="flex-start" flex="1" minW="0">
              <LinkOverlay textStyle="sm" fontWeight="bold" asChild>
                <TypedNextLink href={`/governance/${proposalId}`}>
                  {t("You voted a {{type}}", { type: t(proposalType) })}
                </TypedNextLink>
              </LinkOverlay>
              <Text textStyle="sm" color="text.subtle" lineClamp={2}>
                {t('You voted "{{voteChoice}}" in the {{title}} {{type}}', {
                  voteChoice: getVoteChoice(support, t),
                  title: proposalTitle,
                  type: t(proposalType),
                })}
              </Text>
            </VStack>
            <Text textStyle="xs" color="text.subtle">
              {dayjs.unix(activity.date).fromNow()}
            </Text>
          </HStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
