import { CheckboxCard, Heading, Flex, Icon, Progress, Text } from "@chakra-ui/react"
import { Group } from "iconoir-react"

import { AppImage } from "@/components/AppImage/AppImage"

interface AppRadioCardProps {
  appId: string
  appName: string
  appVoters: number
  appVotesReceived: bigint
  totalVotes: bigint
  checked?: boolean
  onCheckedChange: VoidFunction
}

export const AppRadioCard = ({
  checked = false,
  onCheckedChange,
  appId,
  appName,
  appVoters,
  appVotesReceived,
  totalVotes,
}: AppRadioCardProps) => (
  <CheckboxCard.Root
    rounded="lg"
    p="3"
    colorPalette="blue"
    checked={checked}
    onCheckedChange={onCheckedChange}
    cursor="pointer">
    <CheckboxCard.HiddenInput />
    <CheckboxCard.Control alignItems="center" p="0" gap="3">
      <CheckboxCard.Indicator rounded="sm" />
      <AppImage appId={appId} gridRow="1 / 3" />
      <CheckboxCard.Content gap="0.5">
        <Heading fontSize="md">{appName}</Heading>
        <Flex w="full" justifyContent="space-between">
          <Text display="flex" gap="2" textStyle="xs">
            <Icon as={Group} boxSize="4" />
            {appVoters ?? 0}
          </Text>
          <Text textStyle="xs" fontWeight="bold">
            {((appVotesReceived * 100n) / totalVotes).toString() + "%"}
          </Text>
        </Flex>
        <Progress.Root w="full" size="xs" colorPalette="green" mt="1" value={50}>
          <Progress.Track rounded="lg">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </CheckboxCard.Content>
    </CheckboxCard.Control>
  </CheckboxCard.Root>
)
