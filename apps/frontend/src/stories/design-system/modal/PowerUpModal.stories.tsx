import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { PowerUpModal } from "@/app/allocations/components/PowerUpModal"

const meta: Meta<typeof PowerUpModal> = {
  title: "design-system/components/Modal/PowerUp Modal",
  component: PowerUpModal,
}

export default meta
type Story = StoryObj<typeof PowerUpModal>

export const SwapStep: Story = {
  render: () => <PowerUpModal isOpen onClose={() => {}} />,
}
