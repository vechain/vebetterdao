import { Text, Card, VStack, HStack, Icon, LinkBox, LinkOverlay } from "@chakra-ui/react"
import dayjs from "dayjs"
import NextLink from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"
import { FaRegCircleCheck } from "react-icons/fa6"
import { LuChevronRight } from "react-icons/lu"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

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
    <LinkBox as={Card.Root} variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
      <Card.Body p="0">
        <HStack gap="3" align="flex-start" w="full">
          <Icon as={FaRegCircleCheck} color="status.positive.strong" boxSize="5" mt="0.5" flexShrink={0} />
          <VStack gap="1" align="flex-start" flex="1" minW="0">
            <LinkOverlay asChild>
              <NextLink href={`/grants/${activity.metadata.proposalId}`}>
                <Text textStyle="sm" fontWeight="bold">
                  {title}
                </Text>
              </NextLink>
            </LinkOverlay>
            <Text textStyle="sm" color="text.subtle">
              {activity.metadata.proposalTitle}
            </Text>
          </VStack>
          <HStack gap="1" flexShrink={0}>
            <Text textStyle="xs" color="text.subtle">
              {dayjs.unix(activity.date).fromNow()}
            </Text>
            <Icon as={LuChevronRight} boxSize="4" color="text.subtle" />
          </HStack>
        </HStack>
      </Card.Body>
    </LinkBox>
  )
}
