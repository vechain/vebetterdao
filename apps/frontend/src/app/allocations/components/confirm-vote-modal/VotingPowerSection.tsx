"use client"

import { Card, Center, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Flash } from "iconoir-react"
import { useTranslation } from "react-i18next"

interface VotingPowerSectionProps {
  vot3Balance: { original: string; scaled: string; formatted: string } | undefined
  isLoading: boolean
  button?: React.ReactNode
}

export const VotingPowerSection = ({ vot3Balance, isLoading, button }: VotingPowerSectionProps) => {
  const { t } = useTranslation()

  // Use the pre-formatted value from the hook
  const formatted = vot3Balance?.formatted ?? "0"

  return (
    <Card.Root variant="subtle" p={4}>
      <VStack gap={3.5} alignItems="stretch">
        <HStack
          justify="space-between"
          align="center"
          pb={button ? 4 : 0}
          borderBottomWidth={button ? "1px" : "0"}
          borderColor="border.secondary">
          <HStack gap={1}>
            <Icon as={Flash} boxSize={4} color="text.subtle" />
            <Text textStyle="sm" color="text.subtle" fontWeight="semibold" lineHeight="16px">
              {t("Voting Power")}
            </Text>
          </HStack>
          <Skeleton loading={isLoading}>
            <Text textStyle="sm" fontWeight="semibold" lineHeight="24px" textAlign="center">
              {formatted}
            </Text>
          </Skeleton>
        </HStack>
        {button && <Center>{button}</Center>}
      </VStack>
    </Card.Root>
  )
}
