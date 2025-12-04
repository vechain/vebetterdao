import { Meta, StoryObj } from "@storybook/nextjs-vite"

import { VoteTabSkeleton } from "@/app/allocations/components/tabs/VoteTabSkeleton"

const meta = {
  title: "pages/allocations/VoteTabSkeleton",
  component: VoteTabSkeleton,
} satisfies Meta<typeof VoteTabSkeleton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
