import type { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { NodeUpgradeModal } from "./NodeUpgradeModal"

const meta = {
  title: "pages/components/NodeUpgradeModal",
  component: NodeUpgradeModal,
  parameters: { layout: "centered" },
} satisfies Meta<typeof NodeUpgradeModal>

export default meta

export const LightMode = () => <NodeUpgradeModal isOpen onClose={() => {}} />

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
