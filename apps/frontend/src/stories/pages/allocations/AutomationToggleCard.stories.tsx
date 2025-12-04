import { Icon, Text, VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { Settings } from "iconoir-react"
import { cloneElement, useState } from "react"

import { AutomationToggleCard } from "@/app/allocations/components/AutomationToggleCard"

const meta = {
  title: "pages/allocations/AutomationToggleCard",
  component: AutomationToggleCard,
} satisfies Meta<typeof AutomationToggleCard>

export default meta

export const Default = () => {
  const [checked, setChecked] = useState(false)

  return (
    <VStack gap="4" alignItems="stretch" maxW="500px">
      <AutomationToggleCard
        checked={checked}
        onCheckedChange={setChecked}
        icon={<Icon as={Settings} boxSize="5" color="text.subtle" />}
        nextRoundNumber={10}
      />
    </VStack>
  )
}

export const DarkMode = () => cloneElement(<Default />)
DarkMode.globals = { theme: "dark" }

export const AllStates = () => {
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(true)
  const [checked3, setChecked3] = useState(true)
  const [checked4, setChecked4] = useState(true)

  return (
    <VStack gap="6" alignItems="stretch" maxW="500px">
      <Text fontWeight="bold">1. Default (not enabled)</Text>
      <AutomationToggleCard
        checked={checked1}
        onCheckedChange={setChecked1}
        nextRoundNumber={10}
        icon={<Icon as={Settings} boxSize="5" color="text.subtle" />}
      />

      <Text fontWeight="bold">2. Enabling for first time (not on-chain yet)</Text>
      <AutomationToggleCard
        checked={checked2}
        onCheckedChange={setChecked2}
        nextRoundNumber={10}
        isEnabledOnChain={false}
        icon={<Icon as={Settings} boxSize="5" color="text.subtle" />}
      />

      <Text fontWeight="bold">3. Already enabled on-chain</Text>
      <AutomationToggleCard
        checked={checked3}
        onCheckedChange={setChecked3}
        nextRoundNumber={10}
        isEnabledOnChain={true}
        hasVoted={true}
        icon={<Icon as={Settings} boxSize="5" color="text.subtle" />}
      />

      <Text fontWeight="bold">4. Locked - Waiting for relayer vote (cannot toggle off)</Text>
      <AutomationToggleCard
        checked={checked4}
        onCheckedChange={setChecked4}
        nextRoundNumber={10}
        isEnabledOnChain={true}
        hasVoted={false}
        isActiveInCurrentRound={true}
        icon={<Icon as={Settings} boxSize="5" color="text.subtle" />}
      />
    </VStack>
  )
}

export const LockedPendingRelayerVote = () => {
  return (
    <VStack gap="4" alignItems="stretch" maxW="500px">
      <Text color="text.subtle" textStyle="sm">
        Toggle is disabled because automation is active for this round and the relayer hasn&apos;t voted yet.
      </Text>
      <AutomationToggleCard
        checked={true}
        onCheckedChange={() => {}}
        nextRoundNumber={10}
        isEnabledOnChain={true}
        hasVoted={false}
        isActiveInCurrentRound={true}
        icon={<Icon as={Settings} boxSize="5" color="text.subtle" />}
      />
    </VStack>
  )
}
