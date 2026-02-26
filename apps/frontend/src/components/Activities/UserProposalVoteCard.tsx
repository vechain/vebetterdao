import { Card, HStack, Icon, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { TFunction } from "i18next"
import { DesignNibSolid } from "iconoir-react"
import NextLink, { type LinkProps } from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const TypedNextLink = NextLink as React.FC<React.PropsWithChildren<LinkProps>>

type Props = {
  activity: ActivityItem & { type: ActivityType.USER_PROPOSAL_VOTE_CAST }
}

const getVoteChoice = (support: number, t: TFunction) => {
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
  const href = proposalType === "grant" ? `/grants/${proposalId}` : `/proposals/${proposalId}`

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <HStack gap="3" align="flex-start" w="full">
            <Icon as={DesignNibSolid} color="status.neutral.strong" boxSize="5" mt="0.5" flexShrink={0} />
            <VStack gap="1" align="flex-start" flex="1" minW="0">
              <LinkOverlay textStyle="sm" fontWeight="bold" asChild>
                <TypedNextLink href={href}>{t("You voted on a proposal")}</TypedNextLink>
              </LinkOverlay>
              <Text textStyle="sm" color="text.subtle" lineClamp={2}>
                {t('You voted "{{voteChoice}}" in the {{title}} proposal', {
                  voteChoice: getVoteChoice(support, t),
                  title: proposalTitle,
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
