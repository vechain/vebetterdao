"use client"

import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Sparks } from "iconoir-react"
import { useTranslation } from "react-i18next"

interface FreshnessHintProps {
  /** Whether the user changed their app selection since last vote */
  isUpdated: boolean
  /** The multiplier tier label (e.g., "x3", "x2", "x1") */
  tierLabel: string
  /** Whether this is a first-time voter */
  isFirstVote: boolean
  /** Hide the description message */
  hideDescription?: boolean
}

/**
 * Shows the user's freshness multiplier status in the vote confirmation modal.
 * Encourages users to change their app selection for higher rewards.
 */
export const FreshnessHint = ({ isUpdated, tierLabel, isFirstVote, hideDescription }: FreshnessHintProps) => {
  const { t } = useTranslation()

  const getBgColor = () => {
    if (isFirstVote || isUpdated) return "green.subtle"
    return "orange.subtle"
  }

  const getTextColor = () => {
    if (isFirstVote || isUpdated) return "green.fg"
    return "orange.fg"
  }

  const getMessage = () => {
    if (isFirstVote) {
      return t("First vote! You'll receive the maximum freshness bonus on your rewards.")
    }
    if (isUpdated) {
      return t("You updated your app selection! You'll receive a higher freshness bonus on your rewards.")
    }
    return t("Tip: Weekly update your app selection to earn a higher freshness bonus on your rewards.")
  }

  return (
    <Box bg={getBgColor()} borderRadius="lg" p={3}>
      <HStack gap={2} align="start">
        <Icon as={Sparks} boxSize={4} color={getTextColor()} mt={0.5} />
        <VStack gap={0} align="start">
          <HStack gap={1}>
            <Text textStyle="sm" fontWeight="semibold" color={getTextColor()}>
              {t("Freshness Bonus")}
              {":"}
            </Text>
            <Text textStyle="sm" fontWeight="bold" color={getTextColor()}>
              {tierLabel}
            </Text>
          </HStack>
          {!hideDescription && (
            <Text textStyle="xs" color={getTextColor()} opacity={0.8}>
              {getMessage()}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  )
}
