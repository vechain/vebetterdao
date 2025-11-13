"use client"

import { Box, HStack, IconButton, NumberInput, Skeleton, Text, VStack } from "@chakra-ui/react"
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

  const handleValueChange = useCallback(
    (details: { value: string; valueAsNumber: number }) => {
      onPercentageChange(details.valueAsNumber || 0)
    },
    [onPercentageChange],
  )

  return (
    <Box bg="bg.subtle" borderRadius="xl" p={4} borderWidth="1px" borderColor="border.primary">
      <VStack gap={3} alignItems="stretch">
        {/* App Info */}
        <HStack gap={3}>
          <AppImage appId={app.id} boxSize="36px" borderRadius="md" />
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

          <NumberInput.Root
            value={displayValue}
            onValueChange={handleValueChange}
            min={0}
            max={100}
            step={1}
            clampValueOnBlur
            formatOptions={{ maximumFractionDigits: 2 }}>
            <HStack gap={3}>
              <NumberInput.DecrementTrigger asChild>
                <IconButton
                  aria-label={t("Decrease percentage")}
                  rounded="full"
                  bg="actions.secondary.default"
                  _hover={{ bg: "actions.secondary.hover" }}
                  size="xs"
                  boxSize={9}
                  maxW={9}
                  maxH={9}
                  p={1}
                  flexShrink={0}>
                  <Minus strokeWidth={2} />
                </IconButton>
              </NumberInput.DecrementTrigger>

              <Box flex={1} position="relative">
                <NumberInput.Input
                  placeholder="0"
                  textAlign="center"
                  borderRadius="xl"
                  h={9}
                  bg="bg.primary"
                  borderColor="border.primary"
                  borderWidth="1px"
                  pl={3}
                  pr={2.5}
                  py={3}
                  color="text.subtle"
                  fontSize="md"
                  _focus={{
                    borderColor: "border.primary",
                    boxShadow: "none",
                  }}
                />
                <Box position="absolute" right={2.5} top="50%" transform="translateY(-50%)" pointerEvents="none">
                  <Text color="text.default" fontSize="md">
                    {"%"}
                  </Text>
                </Box>
              </Box>

              <NumberInput.IncrementTrigger asChild>
                <IconButton
                  aria-label={t("Increase percentage")}
                  rounded="full"
                  bg="actions.secondary.default"
                  _hover={{ bg: "actions.secondary.hover" }}
                  size="xs"
                  boxSize={9}
                  maxW={9}
                  maxH={9}
                  p={1}
                  flexShrink={0}>
                  <Plus strokeWidth={2} />
                </IconButton>
              </NumberInput.IncrementTrigger>
            </HStack>
          </NumberInput.Root>
        </VStack>
      </VStack>
    </Box>
  )
}
