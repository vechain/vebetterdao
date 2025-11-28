import { Icon, VStack } from "@chakra-ui/react"
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
