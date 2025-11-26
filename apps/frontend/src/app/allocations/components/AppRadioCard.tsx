import { CheckboxCard, Heading, Flex, Icon, Progress, Text, VStack, Badge } from "@chakra-ui/react"
import { Group } from "iconoir-react"

import { AppImage } from "@/components/AppImage/AppImage"
import { AppCategoryItem } from "@/types/appDetails"

interface AppRadioCardProps {
  appId: string
  appName: string
  appCategory?: AppCategoryItem
  appVoters: number
  allocationSharePercentage?: number
  checked?: boolean
  onCheckedChange: VoidFunction
}

export const AppRadioCard = ({
  checked = false,
  onCheckedChange,
  appId,
  appCategory,
  appName,
  appVoters,
  allocationSharePercentage,
}: AppRadioCardProps) => (
  <CheckboxCard.Root
    bg="bg.primary"
    rounded="lg"
    border="1px"
    p={{ base: "3", md: "5" }}
    colorPalette="blue"
    checked={checked}
    onCheckedChange={onCheckedChange}
    cursor="pointer">
    <CheckboxCard.HiddenInput />
    <CheckboxCard.Control alignItems="center" p="0" gap="3">
      <CheckboxCard.Indicator rounded="sm" />
      <AppImage boxSize={{ base: "44px", md: "60px" }} borderRadius="0.5rem" appId={appId} />

      <CheckboxCard.Content
        flexDirection={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems="flex-start"
        gap="0">
        <VStack flex={1} gap="0.5" align="start">
          <Heading size={{ base: "md", md: "lg" }}>{appName}</Heading>
          {appCategory && (
            <Badge hideBelow="md" variant="neutral" size="sm" rounded="sm" width="max-content" height="max-content">
              {appCategory.name}
            </Badge>
          )}
        </VStack>

        <VStack flex={1} gap="0.5" alignSelf={{ base: "flex-start", md: "flex-end" }} w={{ base: "full", md: "unset" }}>
          <Flex w="full" justifyContent="space-between" gap="4">
            <Text display="flex" alignItems="center" gap={{ base: "2", md: "1" }} textStyle={{ base: "xs", md: "sm" }}>
              <Icon as={Group} boxSize="4" />
              {appVoters ?? 0}
              <Text as="span" hideBelow="md" display="inline" textStyle={{ base: "xs", md: "sm" }}>
                {"Voters"}
              </Text>
            </Text>
            {allocationSharePercentage && (
              <Text textStyle={{ base: "xs", md: "sm" }} fontWeight="bold">
                {allocationSharePercentage.toFixed(2) + "% "}
                <Text as="span" hideBelow="md" textStyle={{ base: "xs", md: "sm" }} display="inline" fontWeight="bold">
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
