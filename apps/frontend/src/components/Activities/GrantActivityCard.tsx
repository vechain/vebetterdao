import { Text, Card, VStack, HStack, Icon, LinkBox, LinkOverlay } from "@chakra-ui/react"
import dayjs from "dayjs"
import NextLink, { type LinkProps } from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"

import ThumbsUpSolidIcon from "@/components/Icons/svg/thumbs-up-solid.svg"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const TypedNextLink = NextLink as React.FC<React.PropsWithChildren<LinkProps>>

type Props = {
  activity: ActivityItem & {
    type: ActivityType.GRANT_APPROVED | ActivityType.GRANT_MILESTONE_APPROVED
  }
}

export const GrantActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const isApproved = activity.type === ActivityType.GRANT_APPROVED
  const title = isApproved ? t("Grant approved") : t("Grant milestone approved")

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={ThumbsUpSolidIcon} color="status.positive.strong" boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay textStyle="sm" fontWeight="bold" asChild>
                  <TypedNextLink href={`/grants/${activity.metadata.proposalId}`}>{title}</TypedNextLink>
                </LinkOverlay>
                <Text textStyle="sm" color="text.subtle">
                  {activity.metadata.proposalTitle}
                </Text>
              </VStack>

              <Text textStyle="xs" color="text.subtle">
                {dayjs.unix(activity.date).fromNow()}
              </Text>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
