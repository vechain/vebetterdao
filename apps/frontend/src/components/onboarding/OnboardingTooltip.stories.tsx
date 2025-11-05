import { Box, Button } from "@chakra-ui/react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { expect, userEvent, waitFor, within } from "storybook/test"

import { OnboardingTooltip } from "./OnboardingTooltip"

const meta = {
  title: "Components/Onboarding/OnboardingTooltip",
  component: OnboardingTooltip,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof OnboardingTooltip>

export default meta
type Story = StoryObj<typeof meta>

const steps = [
  {
    title: "Search for apps",
    description: "Use the search bar to find apps you want to vote for",
    placement: "bottom" as const,
  },
  {
    title: "Get voting power",
    description: "Turn B3TR into VOT3 tokens for be able to vote",
    placement: "bottom" as const,
  },
  {
    title: "Vote for apps",
    description: "Select apps and cast your vote to earn rewards",
    placement: "top" as const,
  },
] as const

const InteractiveTooltip = () => {
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <Box p={10}>
      <OnboardingTooltip
        isOpen
        title={steps[currentStep]!.title}
        description={steps[currentStep]!.description}
        currentStep={currentStep + 1}
        totalSteps={steps.length}
        onNext={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
        onPrev={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
        showPrev={currentStep > 0}
        placement={steps[currentStep]!.placement}>
        <Button data-testid="trigger-button">Target Element</Button>
      </OnboardingTooltip>
    </Box>
  )
}

export const Mobile: Story = {
  render: () => <InteractiveTooltip />,
  globals: { viewport: { value: "mobile2" } },
  play: async () => {
    const body = within(document.body)

    await waitFor(() => expect(body.getByText("Search for apps")).toBeInTheDocument())
    await waitFor(() =>
      expect(body.getByText("Use the search bar to find apps you want to vote for")).toBeInTheDocument(),
    )
    await waitFor(() => expect(body.getByText("1/3")).toBeInTheDocument())

    const nextButton = body.getByRole("button", { name: "Next" })
    await expect(nextButton).toBeInTheDocument()

    await userEvent.click(nextButton)
    await waitFor(() => expect(body.getByText("2/3")).toBeInTheDocument())
    await waitFor(() => expect(body.getByText("Get voting power")).toBeInTheDocument())
    await waitFor(() => expect(body.getByText("Turn B3TR into VOT3 tokens for be able to vote")).toBeInTheDocument())

    await userEvent.click(nextButton)
    await waitFor(() => expect(body.getByText("3/3")).toBeInTheDocument())
    await waitFor(() => expect(body.getByText("Vote for apps")).toBeInTheDocument())
    await waitFor(() => expect(body.getByText("Select apps and cast your vote to earn rewards")).toBeInTheDocument())

    const prevButton = body.getByRole("button", { name: "Previous step" })
    await userEvent.click(prevButton)
    await waitFor(() => expect(body.getByText("2/3")).toBeInTheDocument())
    await waitFor(() => expect(body.getByText("Get voting power")).toBeInTheDocument())
  },
}
