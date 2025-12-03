import { Meta, StoryObj } from "@storybook/nextjs-vite"

import { HistoryListSkeleton } from "@/app/allocations/history/components/HistoryListSkeleton"

const meta = {
  title: "pages/allocations/HistoryListSkeleton",
  component: HistoryListSkeleton,
} satisfies Meta<typeof HistoryListSkeleton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
