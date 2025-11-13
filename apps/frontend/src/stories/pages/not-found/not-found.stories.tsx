import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import Custom404 from "@/app/not-found"

const meta = {
  title: "pages/not-found/NotFound",
  component: Custom404,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Custom404>

export default meta
type Story = StoryObj<typeof meta>

export const DesktopLight: Story = {
  parameters: { chromatic: { viewports: [1440] } },
}

export const DesktopDark: Story = {
  parameters: { chromatic: { viewports: [1440] } },
  globals: { theme: "dark" },
}

export const MobileLight: Story = {
  parameters: { chromatic: { viewports: [430] } },
  globals: {
    viewport: { value: "mobile2" },
  },
}

export const MobileDark: Story = {
  parameters: { chromatic: { viewports: [430] } },
  globals: {
    theme: "dark",
    viewport: { value: "mobile2" },
  },
}
