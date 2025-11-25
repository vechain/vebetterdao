import { VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement, useState } from "react"

import { AppRadioCard } from "@/app/allocations/components/AppRadioCard"
import { APP_CATEGORIES } from "@/types/appDetails"

const meta = {
  title: "pages/allocations/AppRadioCard",
  component: AppRadioCard,
} satisfies Meta<typeof AppRadioCard>

export default meta

const mockApp = {
  id: "0x1234567890abcdef",
  name: "MugShot",
  voters: 255,
  category: APP_CATEGORIES[0],
  allocationSharePercentage: 65,
}

/** Default checkbox mode - interactive selection */
export const CheckboxMode = () => {
  const [checked, setChecked] = useState(false)

  return (
    <VStack gap="4" alignItems="stretch" maxW="600px">
      <AppRadioCard
        appId={mockApp.id}
        appName={mockApp.name}
        appVoters={mockApp.voters}
        appCategory={mockApp.category}
        allocationSharePercentage={mockApp.allocationSharePercentage}
        checked={checked}
        onCheckedChange={() => setChecked(!checked)}
        displayMode="checkbox"
      />
    </VStack>
  )
}

/** Voted mode - shows tick icon on app image, non-interactive */
export const VotedMode = () => (
  <VStack gap="4" alignItems="stretch" maxW="600px">
    <AppRadioCard
      appId={mockApp.id}
      appName={mockApp.name}
      appVoters={mockApp.voters}
      appCategory={mockApp.category}
      allocationSharePercentage={mockApp.allocationSharePercentage}
      checked={true}
      displayMode="voted"
    />
    <AppRadioCard
      appId="0xabcdef1234567890"
      appName="GreenCart"
      appVoters={128}
      appCategory={APP_CATEGORIES[1]}
      allocationSharePercentage={35}
      checked={false}
      displayMode="voted"
    />
  </VStack>
)

/** Comparison of both modes side by side */
export const ModeComparison = () => {
  const [checked, setChecked] = useState(true)

  return (
    <VStack gap="6" alignItems="stretch" maxW="600px">
      <AppRadioCard
        appId={mockApp.id}
        appName={`${mockApp.name} (Checkbox Mode)`}
        appVoters={mockApp.voters}
        appCategory={mockApp.category}
        allocationSharePercentage={mockApp.allocationSharePercentage}
        checked={checked}
        onCheckedChange={() => setChecked(!checked)}
        displayMode="checkbox"
      />
      <AppRadioCard
        appId={mockApp.id}
        appName={`${mockApp.name} (Voted Mode)`}
        appVoters={mockApp.voters}
        appCategory={mockApp.category}
        allocationSharePercentage={mockApp.allocationSharePercentage}
        checked={true}
        displayMode="voted"
      />
    </VStack>
  )
}

export const DarkMode = () => cloneElement(<ModeComparison />)
DarkMode.globals = { theme: "dark" }
