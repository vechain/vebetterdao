import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { LeaderboardPageContent } from "@/app/leaderboard/LeaderboardPageContent"

const meta = {
  title: "Pages/Leaderboard",
  component: LeaderboardPageContent,
} satisfies Meta<typeof LeaderboardPageContent>

export default meta
type Story = StoryObj<typeof meta>

export const DesktopLight: Story = {
  args: { roundId: "5" },
  parameters: { chromatic: { viewports: [1440] } },
}

export const DesktopDark: Story = {
  args: { roundId: "5" },
  parameters: { chromatic: { viewports: [1440] } },
  globals: { theme: "dark" },
}

export const MobileLight: Story = {
  args: { roundId: "5" },
  parameters: { chromatic: { viewports: [430] } },
  globals: {
    viewport: { value: "mobile2" },
  },
}

export const MobileDark: Story = {
  args: { roundId: "5" },
  parameters: { chromatic: { viewports: [430] } },
  globals: {
    theme: "dark",
    viewport: { value: "mobile2" },
  },
}
