import { Meta, StoryObj } from "@storybook/nextjs-vite"

import { HistoryDetailSkeleton } from "@/app/allocations/history/components/HistoryDetailSkeleton"

const meta = {
  title: "pages/allocations/HistoryDetailSkeleton",
  component: HistoryDetailSkeleton,
} satisfies Meta<typeof HistoryDetailSkeleton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    roundId: "42",
  },
}
