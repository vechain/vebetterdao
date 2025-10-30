import { Button, Text, VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement, useState } from "react"

import { BaseModal } from "@/components/BaseModal"

const meta = {
  title: "design-system/components/BaseModal",
  component: BaseModal,
} satisfies Meta<typeof BaseModal>

export default meta

export const LightMode = () => {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open modal</Button>

      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaTitle="Responsive Modal"
        ariaDescription="A modal that adapts to screen size"
        showCloseButton>
        <VStack gap={4} align="stretch">
          <Text fontSize="xl" fontWeight="bold">
            Responsive Modal
          </Text>
          <Text>
            This modal adapts to the screen size. On desktop (≥1060px), it displays as a centered dialog. On mobile
            (&lt;1060px), it displays as a bottom sheet.
          </Text>
        </VStack>
      </BaseModal>
    </>
  )
}

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "responsive" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
