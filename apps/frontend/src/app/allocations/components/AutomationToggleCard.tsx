"use client"

import { Card, HStack, VStack, Text, Switch, Box, Icon, Link } from "@chakra-ui/react"
import { Check, InfoCircle } from "iconoir-react"
import { useTranslation, Trans } from "react-i18next"

import ProcessIcon from "@/components/Icons/svg/process.svg"

const AUTOMATION_DOCS_URL = "https://docs.vebetterdao.org/vebetterdao/automation#service-fee"

export interface AutomationToggleCardProps {
  checked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  icon?: React.ReactNode
  nextRoundNumber?: number | string
}

export const AutomationToggleCard = ({
  checked = false,
  disabled = false,
  onCheckedChange,
  icon,
  nextRoundNumber,
}: AutomationToggleCardProps) => {
  const { t } = useTranslation()
  return (
    <Card.Root
      variant="outline"
      p={{ base: "3", md: "4" }}
      border="sm"
      borderColor="border.secondary"
      bg="cards.default">
      <VStack gap={{ base: "3", md: "6" }} w="full" alignItems="stretch">
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
              <Text textStyle={{ base: "md", md: "md" }} fontWeight="semibold" color="text.default">
                {t("Auto-vote & claim")}
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

        {checked && (
          <VStack alignItems="flex-start" gap="3" w="full">
            <HStack gap="2" alignItems="flex-start">
              <Icon as={Check} boxSize="4" color="text.subtle" mt="0.5" />
              <Text textStyle="xs" color="text.subtle">
                {t("Your votes and rewards will be handled weekly automatically. Stay active to keep it running.")}
              </Text>
            </HStack>

            <HStack gap="2" alignItems="flex-start">
              <Icon as={Check} boxSize="4" color="text.subtle" mt="0.5" />
              <Text textStyle="xs" color="text.subtle">
                <Trans
                  i18nKey="A 10% <0>service fee</0> is deducted from weekly B3TR rewards, capped at 100 B3TR."
                  components={[
                    <Link
                      key="0"
                      href={AUTOMATION_DOCS_URL}
                      target="_blank"
                      textDecoration="underline"
                      color="text.subtle"
                      _hover={{ color: "text.default" }}
                    />,
                  ]}
                />
              </Text>
            </HStack>

            <HStack gap="2" alignItems="center">
              <Icon as={InfoCircle} boxSize="4" color="text.subtle" />
              <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                {t("Activates from Round {{round}} onwards", { round: nextRoundNumber })}
              </Text>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Card.Root>
  )
}
