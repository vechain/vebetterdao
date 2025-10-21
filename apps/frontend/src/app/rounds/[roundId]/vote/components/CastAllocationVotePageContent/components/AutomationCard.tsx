import { Card, VStack, Heading, Text, HStack, Switch } from "@chakra-ui/react"

type Props = {
  isAutomationEnabled: boolean
  onAutomationChange: (_enabled: boolean) => void
}

export const AutomationCard = ({ isAutomationEnabled, onAutomationChange }: Props) => {
  return (
    <Card.Root
      bg={{ base: "transparent", md: "bg.primary" }}
      px={{ base: "0", md: "6" }}
      w="full"
      border="sm"
      borderColor="border.secondary">
      <VStack gap={4} align="flex-start" w="full">
        <HStack w="full" justify="space-between" align="center">
          <VStack gap={2} align="flex-start" flex={1}>
            <Heading size="xl">{`Automation`}</Heading>
            <Text textStyle="md" color="text.subtle">
              {`Automate voting and reward claims weekly until December XX, 2025 — works longer while you're taking
              sustainable actions.`}
            </Text>
          </VStack>
          <Switch.Root
            colorPalette="primary"
            checked={isAutomationEnabled}
            onCheckedChange={({ checked }) => onAutomationChange(!!checked)}
            size="lg">
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      </VStack>
    </Card.Root>
  )
}
