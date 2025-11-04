import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { NavbarLogo } from "@/components/Navbar/NavbarLogo"

const meta = {
  title: "design-system/components/Logo",
  component: NavbarLogo,
} satisfies Meta<typeof NavbarLogo>

export default meta
type Story = StoryObj<typeof meta>

export const LightMode: Story = {}

export const DarkMode: Story = {
  globals: {
    theme: "dark",
  },
}
