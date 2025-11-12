"use client"

import { Box, HStack, IconButton, Input, InputGroup, Skeleton, Text, VStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { Minus, Plus } from "iconoir-react"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { AppImage } from "@/components/AppImage/AppImage"

import type { AppWithVotes } from "../../page"

interface AppAllocationCardProps {
  app: AppWithVotes
  percentage: number
  onPercentageChange: (percentage: number) => void
  vot3Balance: { original: string; scaled: string; formatted: string } | undefined
  isLoadingBalance: boolean
}

export const AppAllocationCard = ({
  app,
  percentage,
  onPercentageChange,
  vot3Balance,
  isLoadingBalance,
}: AppAllocationCardProps) => {
  const { t } = useTranslation()

  const displayValue = useMemo(() => {
    if (percentage === 0) return ""
    // Format to 2 decimal places, removing trailing zeros
    const formatted = percentage.toFixed(2)
    return formatted.replace(/\.?0+$/, "")
  }, [percentage])

  const votingPowerForApp = useMemo(() => {
    if (!vot3Balance) return "0"
    const original = Number(vot3Balance.original)
    const scaled = formatEther(BigInt(original))
    const allocated = (parseFloat(scaled) * percentage) / 100
    return allocated === 0 ? "0" : FormattingUtils.humanNumber(allocated.toString())
  }, [vot3Balance, percentage])

  const handleInputChange = useCallback(
    (value: string) => {
      const newValue = value
        .replace(",", ".") // Replace comma with dot
        .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
        .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
        .replace(/(\.\d\d)\d+/g, "$1") // Remove decimal digits after the second one

      if (newValue === "") {
        onPercentageChange(0)
        return
      }

      let numericValue = parseFloat(newValue)
      if (isNaN(numericValue)) {
        numericValue = 0
      }

      // Cap at 100
      if (numericValue > 100) {
        numericValue = 100
      }

      onPercentageChange(numericValue)
    },
    [onPercentageChange],
  )

  const handleIncrement = useCallback(() => {
    const newPercentage = Math.min(100, Math.round((percentage + 1) * 100) / 100)
    onPercentageChange(newPercentage)
  }, [percentage, onPercentageChange])

  const handleDecrement = useCallback(() => {
    const newPercentage = Math.max(0, Math.round((percentage - 1) * 100) / 100)
    onPercentageChange(newPercentage)
  }, [percentage, onPercentageChange])

  return (
    <Box bg="bg.subtle" borderRadius="xl" p={4} borderWidth="1px" borderColor="border.primary">
      <VStack gap={3} alignItems="stretch">
        {/* App Info */}
        <HStack gap={3}>
          <AppImage appId={app.id} boxSize="48px" borderRadius="lg" />
          <Text textStyle="md" fontWeight="semibold" flex={1}>
            {app.metadata?.name ?? app.name}
          </Text>
        </HStack>

        {/* Allocation Controls */}
        <VStack gap={2} alignItems="stretch">
          <HStack justify="space-between">
            <Text textStyle="sm" color="text.subtle">
              {t("Allocate voting power")}
            </Text>
            <VStack gap={0} alignItems="flex-end">
              <Text textStyle="md" fontWeight="semibold">
                {displayValue || "0"}
                {"%"}
              </Text>
              <Skeleton loading={isLoadingBalance}>
                <Text textStyle="xs" color="text.subtle">
                  {votingPowerForApp}
                </Text>
              </Skeleton>
            </VStack>
          </HStack>

          {/* Input with +/- buttons */}
          <HStack gap={2}>
            <IconButton
              aria-label={t("Decrease percentage")}
              size="sm"
              variant="surface"
              rounded="full"
              colorPalette="blue"
              onClick={handleDecrement}
              disabled={percentage <= 0}>
              <Minus />
            </IconButton>

            <InputGroup flex={1} endElement={<Text color="text.subtle">{"%"}</Text>}>
              <Input
                value={displayValue}
                onChange={e => handleInputChange(e.target.value)}
                placeholder="0"
                textAlign="center"
                borderRadius="full"
              />
            </InputGroup>

            <IconButton
              aria-label={t("Increase percentage")}
              size="sm"
              variant="surface"
              rounded="full"
              colorPalette="blue"
              onClick={handleIncrement}
              disabled={percentage >= 100}>
              <Plus />
            </IconButton>
          </HStack>
        </VStack>
      </VStack>
    </Box>
  )
}
