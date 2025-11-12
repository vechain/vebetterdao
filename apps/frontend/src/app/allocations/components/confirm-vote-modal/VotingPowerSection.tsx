"use client"

import { Box, HStack, Icon, Skeleton, Text } from "@chakra-ui/react"
import { Flash } from "iconoir-react"
import { useTranslation } from "react-i18next"

interface VotingPowerSectionProps {
  vot3Balance: { original: string; scaled: string; formatted: string } | undefined
  isLoading: boolean
}

export const VotingPowerSection = ({ vot3Balance, isLoading }: VotingPowerSectionProps) => {
  const { t } = useTranslation()

  // Use the pre-formatted value from the hook
  const formatted = vot3Balance?.formatted ?? "0"

  return (
    <Box bg="bg.subtle" borderRadius="xl" p={4} borderWidth="1px" borderColor="border.primary">
      <HStack justify="space-between" align="center">
        <HStack gap={2}>
          <Icon as={Flash} boxSize={4} color="text.subtle" />
          <Text textStyle="sm" color="text.subtle" fontWeight="medium">
            {t("Voting Power")}
          </Text>
        </HStack>
        <Skeleton loading={isLoading}>
          <Text textStyle="lg" fontWeight="semibold">
            {formatted}
          </Text>
        </Skeleton>
      </HStack>
    </Box>
  )
}
