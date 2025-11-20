"use client"

import { Card, HStack, VStack, Text, Switch, Box, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import ProcessIcon from "@/components/Icons/svg/process.svg"

export interface AutomationToggleCardProps {
  checked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  icon?: React.ReactNode
}

export const AutomationToggleCard = ({
  checked = false,
  disabled = false,
  onCheckedChange,
  icon,
}: AutomationToggleCardProps) => {
  const { t } = useTranslation()
  return (
    <Card.Root
      variant="outline"
      p={{ base: "3", md: "4" }}
      border="sm"
      borderColor="border.secondary"
      bg="cards.default">
      <HStack justify="space-between" alignItems="center" gap={{ base: "2", md: "3" }} w="full">
        <HStack gap={{ base: "2", md: "3" }} flex={1} alignItems="center">
          <Box
            bg="status.neutral.subtle"
            borderRadius="4px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            w={{ base: "8", md: "8" }}
            h={{ base: "8", md: "8" }}
            flexShrink={0}>
            {icon ? icon : <Icon as={ProcessIcon} boxSize={{ base: "4", md: "5" }} color="text.subtle" />}
          </Box>
          <VStack alignItems="flex-start" gap="0.5" flex={1} minW={0}>
            <Text textStyle={{ base: "sm", md: "md" }} fontWeight="semibold" color="text.default">
              {t("Automation")}
            </Text>
            <Text textStyle={{ base: "xs", md: "xs" }} color="text.subtle" fontWeight="regular" lineClamp={2}>
              {/* @TODO: Add translation after decided */}
              {"Auto vote and claim rewards"}
            </Text>
          </VStack>
        </HStack>
        <Switch.Root
          size={{ base: "sm", md: "sm" }}
          checked={checked}
          disabled={disabled}
          onCheckedChange={e => onCheckedChange?.(e.checked)}
          flexShrink={0}>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>
      </HStack>
    </Card.Root>
  )
}
