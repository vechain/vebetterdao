import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { http, HttpResponse } from "msw"

import { LeaderboardPageContent } from "@/app/leaderboard/LeaderboardPageContent"

const data = [
  { wallet: "0x1234567890123456789012345678901234567890", actionsRewarded: 1000, roundId: 5 },
  { wallet: "0x2345678901234567890123456789012345678901", actionsRewarded: 950, roundId: 5 },
  { wallet: "0x3456789012345678901234567890123456789012", actionsRewarded: 900, roundId: 5 },
  { wallet: "0x4567890123456789012345678901234567890123", actionsRewarded: 850, roundId: 5 },
  { wallet: "0x5678901234567890123456789012345678901234", actionsRewarded: 800, roundId: 5 },
  { wallet: "0x6789012345678901234567890123456789012345", actionsRewarded: 750, roundId: 5 },
  { wallet: "0x7890123456789012345678901234567890123456", actionsRewarded: 700, roundId: 5 },
  { wallet: "0x8901234567890123456789012345678901234567", actionsRewarded: 650, roundId: 5 },
  { wallet: "0x9012345678901234567890123456789012345678", actionsRewarded: 600, roundId: 5 },
  { wallet: "0x0123456789012345678901234567890123456789", actionsRewarded: 550, roundId: 5 },
]

const meta = {
  title: "pages/leaderboard/LeaderboardPageContent",
  component: LeaderboardPageContent,
  parameters: {
    msw: {
      handlers: [
        http.get("*/api/v1/b3tr/actions/leaderboards/users", () =>
          HttpResponse.json({
            data,
            pagination: { hasNext: false },
          }),
        ),
      ],
    },
  },
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
