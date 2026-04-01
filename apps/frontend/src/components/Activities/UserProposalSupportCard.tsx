import { Card, HStack, Icon, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import dayjs from "dayjs"
import { formatEther } from "ethers"
import NextLink, { type LinkProps } from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"

import HeartSolidIcon from "@/components/Icons/svg/heart-solid.svg"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const TypedNextLink = NextLink as React.FC<React.PropsWithChildren<LinkProps>>

type Props = {
  activity: ActivityItem & { type: ActivityType.USER_PROPOSAL_SUPPORT }
}

export const UserProposalSupportCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { proposalId, proposalTitle, amount, proposalType } = activity.metadata
  const href = proposalType === "grant" ? `/grants/${proposalId}` : `/proposals/${proposalId}`
  const formattedAmount = FormattingUtils.humanNumber(formatEther(amount))

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <HStack gap="3" align="flex-start" w="full">
            <Icon as={HeartSolidIcon} color="status.positive.strong" boxSize="5" mt="0.5" flexShrink={0} />
            <VStack gap="1" align="flex-start" flex="1" minW="0">
              <LinkOverlay textStyle="sm" fontWeight="bold" asChild>
                <TypedNextLink href={href}>{t("You supported a proposal")}</TypedNextLink>
              </LinkOverlay>
              <Text textStyle="sm" color="text.subtle" lineClamp={2}>
                {t('You supported "{{title}}" with {{amount}} VOT3', {
                  title: proposalTitle,
                  amount: formattedAmount,
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
