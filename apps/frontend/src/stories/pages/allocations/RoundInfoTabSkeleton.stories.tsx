import { Meta, StoryObj } from "@storybook/nextjs-vite"

import { RoundInfoTabSkeleton } from "@/app/allocations/components/tabs/RoundInfoTabSkeleton"

const meta = {
  title: "pages/allocations/RoundInfoTabSkeleton",
  component: RoundInfoTabSkeleton,
} satisfies Meta<typeof RoundInfoTabSkeleton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
