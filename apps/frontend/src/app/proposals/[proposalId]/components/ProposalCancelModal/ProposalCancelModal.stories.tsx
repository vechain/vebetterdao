import type { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { ProposalCancelModal } from "./ProposalCancelModal"

const meta = {
  title: "pages/proposals/ProposalCancelModal",
  component: ProposalCancelModal,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ProposalCancelModal>

export default meta

export const LightMode = () => (
  <ProposalCancelModal isOpen={true} onClose={() => {}} proposalId="1" proposalTypeText="grant" />
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
