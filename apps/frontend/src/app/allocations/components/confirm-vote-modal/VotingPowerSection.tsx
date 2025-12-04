"use client"

import { Card, Center, HStack, Icon, Separator, Skeleton, Text } from "@chakra-ui/react"
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
    <Card.Root variant="outline" p={4} border="sm" borderColor="border.secondary">
      <HStack justify="space-between" align="center">
        <HStack gap={2}>
          <Icon as={Flash} boxSize={4} color="text.subtle" />
          <Text textStyle="md" fontWeight="semibold">
            {t("Voting Power")}
          </Text>
        </HStack>
        <Skeleton loading={isLoading}>
          <Text textStyle="lg" fontWeight="bold" textAlign="center">
            {formatted}
          </Text>
        </Skeleton>
      </HStack>

      {button && (
        <>
          <Separator color="border.secondary" my="4" />
          <Center>{button}</Center>
        </>
      )}
    </Card.Root>
  )
}
