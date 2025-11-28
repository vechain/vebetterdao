import { Box, CheckboxCard, Circle, Float, Heading, Flex, Icon, Progress, Text, VStack, Badge } from "@chakra-ui/react"
import { Check, Group } from "iconoir-react"

import { AppImage } from "@/components/AppImage/AppImage"
import { AppCategoryItem } from "@/types/appDetails"

export type DisplayMode = "checkbox" | "voted"

export interface AppRadioCardProps {
  appId: string
  appName: string
  appCategory?: AppCategoryItem
  appVoters: number
  allocationSharePercentage?: number
  checked?: boolean
  onCheckedChange?: VoidFunction
  displayMode?: DisplayMode // Display mode: "checkbox" shows checkbox indicator, "voted" shows tick icon on app image
  disabled?: boolean // Disable selection (e.g., when max apps reached)
}

export const AppRadioCard = ({
  checked = false,
  onCheckedChange,
  appId,
  appCategory,
  appName,
  appVoters,
  allocationSharePercentage,
  displayMode = "checkbox",
  disabled = false,
}: AppRadioCardProps) => {
  const isVotedMode = displayMode === "voted"
  const isInteractive = !isVotedMode && !!onCheckedChange && !disabled

  return (
    <CheckboxCard.Root
      rounded="lg"
      p={{ base: "3", md: "5" }}
      colorPalette="blue"
      checked={checked}
      onCheckedChange={isInteractive ? onCheckedChange : undefined}
      cursor={isInteractive ? "pointer" : "default"}
      pointerEvents={isInteractive ? "auto" : "none"}
      opacity={disabled && !checked ? 0.5 : 1}>
      {isInteractive && <CheckboxCard.HiddenInput />}
      <CheckboxCard.Control alignItems="center" p="0" gap="3">
        {!isVotedMode && <CheckboxCard.Indicator rounded="sm" />}
        <Box position="relative">
          <AppImage boxSize={{ base: "44px", md: "60px" }} borderRadius="0.5rem" appId={appId} />
          {isVotedMode && checked && (
            <Float placement="top-end" offsetX="1" offsetY="1">
              <Circle size="18px" bg="actions.primary.default" border="2px solid" borderColor="white">
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
          <VStack flex={1} gap="0.5" align="start">
            <Heading size={{ base: "md", md: "lg" }}>{appName}</Heading>
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
                  {"Voters"}
                </Text>
              </Text>
              {allocationSharePercentage && (
                <Text textStyle={{ base: "xs", md: "sm" }} fontWeight="bold">
                  {allocationSharePercentage.toFixed(2) + "% "}
                  <Text
                    as="span"
                    hideBelow="md"
                    textStyle={{ base: "xs", md: "sm" }}
                    display="inline"
                    fontWeight="bold">
                    {"supported"}
                  </Text>
                </Text>
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
