import { Button, Text, VStack, SimpleGrid } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement, useState } from "react"

import { Modal } from "@/components/Modal"

const meta = {
  title: "design-system/components/Modal",
  component: Modal,
} satisfies Meta<typeof Modal>

export default meta

export const LightMode = () => {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Support this proposal with VOT3"
        description="Show your support to this proposal by contributing with your VOT3 tokens, allowing it to be up for voting on Round 12."
        footer={
          <SimpleGrid columns={2} ml="auto" gap="2">
            <Button variant="secondary" onClick={() => setIsOpen(false)} minW="120px" maxW="260px">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Support
            </Button>
          </SimpleGrid>
        }
        showCloseButton
        isCloseable>
        <VStack gap={4} align="stretch">
          <Text>Additional modal content goes here.</Text>
        </VStack>
      </Modal>
    </>
  )
}

export const CenterAlignedWithImage = () => {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        illustration="/assets/mascot/mascot-welcoming.webp"
        title="Support this proposal with VOT3"
        description="Show your support to this proposal by contributing with your VOT3 tokens, allowing it to be up for voting on Round 12."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)} flex={1}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)} flex={1}>
              Support
            </Button>
          </>
        }
        showCloseButton
        isCloseable>
        <VStack gap={4} align="stretch">
          <Text textAlign="center">Additional modal content goes here.</Text>
        </VStack>
      </Modal>
    </>
  )
}

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const CenterAlignedWithImageDarkMode = () => cloneElement(<CenterAlignedWithImage />)
CenterAlignedWithImageDarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
