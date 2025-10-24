import { Card, VStack, Heading, Text, HStack, Switch, Link } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

type Props = {
  isAutomationEnabled: boolean
  onAutomationChange: (_enabled: boolean) => void
}

export const AutomationCard = ({ isAutomationEnabled, onAutomationChange }: Props) => {
  const { t } = useTranslation()

  // TODO: Update this link to the new documentation once it's published
  const DOCUMENTATION_LINK =
    "https://app.gitbook.com/o/PqN0Gs1QEzg8tbeJCHXC/s/5gLJKT3UdlvblZqAiaZ2/~/changes/261/vebetterdao/automation/~/overview"

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
              {t(
                "Automatically vote and claim rewards weekly. The service covers all transaction fees for a 10% fee of your weekly rewards (max 100 B3TR). ",
              )}
              <Link
                href={DOCUMENTATION_LINK}
                target="_blank"
                rel="noopener noreferrer"
                color="primary.500"
                textDecoration="underline"
                fontWeight="medium">
                {`Learn more`}
              </Link>
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
