import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { fn } from "storybook/test"

import { Button } from "@chakra-ui/react"

const meta = {
  title: "B3TR/Button",
  component: Button,
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = () => <Button visual="primary">Primary</Button>

export const Secondary: Story = () => <Button visual="secondary">Secondary</Button>
