"use client"

import { Box, HStack, Icon, IconButton, Text, VStack, useDisclosure } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { Sparks } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { FreshnessMultiplierModal } from "@/app/components/ActionBanners/modals/FreshnessMultiplierModal"

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
  const { open: isMultiplierModalOpen, onOpen: openMultiplierModal, onClose: closeMultiplierModal } = useDisclosure()

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
    <>
      <Box bg={getBgColor()} borderRadius="lg" p={3} w="full">
        <HStack gap={2} align="start">
          <Icon as={Sparks} boxSize={4} color={getTextColor()} mt={0.5} shrink={0} />
          <VStack gap={0} align="start" flex={1} minW={0}>
            <HStack gap={1} w="full" justify="space-between" align="center">
              <HStack gap={1} flexWrap="wrap">
                <Text textStyle="sm" fontWeight="semibold" color={getTextColor()}>
                  {t("Freshness Bonus")}
                  {":"}
                </Text>
                <Text textStyle="sm" fontWeight="bold" color={getTextColor()}>
                  {tierLabel}
                </Text>
              </HStack>
              <IconButton
                variant="ghost"
                size="2xs"
                colorPalette="gray"
                aria-label={t("How rewards multipliers work")}
                onClick={openMultiplierModal}
                color={getTextColor()}
                shrink={0}>
                <Icon as={UilInfoCircle} boxSize={4} />
              </IconButton>
            </HStack>
            {!hideDescription && (
              <Text textStyle="xs" color={getTextColor()} opacity={0.8}>
                {getMessage()}
              </Text>
            )}
          </VStack>
        </HStack>
      </Box>
      <FreshnessMultiplierModal isOpen={isMultiplierModalOpen} onClose={closeMultiplierModal} infoOnly />
    </>
  )
}
