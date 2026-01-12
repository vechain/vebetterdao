import {
  Box,
  Float,
  Circle,
  CheckboxCard,
  Heading,
  Flex,
  Icon,
  Progress,
  Text,
  VStack,
  Badge,
  HStack,
  Tag,
} from "@chakra-ui/react"
import { Check, CheckCircle, Group } from "iconoir-react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"
import { AppCategoryItem } from "@/types/appDetails"

export type DisplayMode = "checkbox" | "voted"

export interface AppRadioCardProps {
  appId: string
  appName: string
  appLogo?: string
  appCategory?: AppCategoryItem
  appVoters: number
  allocationSharePercentage?: number
  checked?: boolean
  onCheckedChange?: VoidFunction
  displayMode?: DisplayMode
  disabled?: boolean
}

export const AppRadioCard = ({
  checked = false,
  onCheckedChange,
  appId,
  appCategory,
  appName,
  appLogo,
  appVoters,
  allocationSharePercentage,
  displayMode = "checkbox",
  disabled = false,
}: AppRadioCardProps) => {
  const { t } = useTranslation()
  const isVotedMode = displayMode === "voted"
  const isInteractive = !isVotedMode && !!onCheckedChange && !disabled

  return (
    <CheckboxCard.Root
      rounded="lg"
      bg="card.default"
      p={{ base: "4", md: "5" }}
      colorPalette="blue"
      checked={checked}
      onCheckedChange={isInteractive ? onCheckedChange : undefined}
      cursor={isInteractive ? "pointer" : "default"}
      pointerEvents={isInteractive ? "auto" : "none"}
      opacity={disabled && !checked ? 0.5 : 1}
      position="relative"
      borderRadius="xl"
      _checked={{ boxShadow: "none" }}>
      {isInteractive && <CheckboxCard.HiddenInput />}
      {isVotedMode && checked && (
        <Float placement="top-end" offsetX="10">
          <Tag.Root bg="status.info.subtle" border="sm" borderColor="borders.active" borderRadius="4px">
            <Tag.Label textStyle={{ base: "xxs", md: "sm" }} color="status.info.strong">
              {t("Voted")}
            </Tag.Label>
          </Tag.Root>
        </Float>
      )}
      <CheckboxCard.Control alignItems="center" p="0" gap="3">
        {!isVotedMode && <CheckboxCard.Indicator rounded="sm" />}
        <Box position="relative">
          <AppImage appId={appId} appLogo={appLogo} boxSize={{ base: "44px", md: "60px" }} borderRadius="0.5rem" />
          {isVotedMode && checked && (
            <Float placement="top-end" offsetX="1" offsetY="1">
              <Circle size="18px" bg="actions.primary.default">
                <Icon as={Check} boxSize="3" color="white" />
              </Circle>
            </Float>
          )}
        </Box>

        <CheckboxCard.Content
          flexDirection={{ base: "column", md: "row" }}
          justifyContent="space-between"
          alignItems="flex-start"
          gap="2">
          <VStack flex={1} gap="0.5" align="start" minW={0} w="full">
            <Flex align="center" gap="2" w="full" minW={0}>
              <Heading size={{ base: "md", md: "lg" }} lineClamp={1}>
                {appName}
              </Heading>
            </Flex>
            {appCategory && (
              <Badge hideBelow="md" variant="neutral" size="sm" rounded="sm" width="max-content" height="max-content">
                {appCategory.name}
              </Badge>
            )}
          </VStack>

          <VStack
            flex={1}
            gap="0.5"
            alignSelf={{ base: "flex-start", md: "flex-end" }}
            w={{ base: "full", md: "unset" }}>
            <Flex w="full" justifyContent="space-between" gap="4">
              <Text
                display="flex"
                alignItems="center"
                gap={{ base: "2", md: "1" }}
                textStyle={{ base: "xs", md: "sm" }}>
                <Icon as={Group} boxSize="4" />
                {appVoters ?? 0}
                <Text as="span" hideBelow="md" display="inline" textStyle={{ base: "xs", md: "sm" }}>
                  {t("Voters")}
                </Text>
              </Text>
              {allocationSharePercentage !== undefined && allocationSharePercentage >= 0 && (
                <HStack gap="2">
                  {allocationSharePercentage === 100 && <Icon as={CheckCircle} boxSize="4" />}

                  <Text textStyle={{ base: "xs", md: "sm" }} fontWeight="bold">
                    {allocationSharePercentage.toFixed(2) + "% "}
                    <Text
                      as="span"
                      hideBelow="md"
                      textStyle={{ base: "xs", md: "sm" }}
                      display="inline"
                      fontWeight="bold">
                      {t("supported")}
                    </Text>
                  </Text>
                </HStack>
              )}
            </Flex>
            <Progress.Root w="full" size="xs" mt="1" value={allocationSharePercentage}>
              <Progress.Track rounded="lg">
                <Progress.Range bgColor="status.positive.primary" />
              </Progress.Track>
            </Progress.Root>
          </VStack>
        </CheckboxCard.Content>
      </CheckboxCard.Control>
    </CheckboxCard.Root>
  )
}
