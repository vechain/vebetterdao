import { VStack, For, Text } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { AllocationAlertCard } from "@/app/allocations/components/AllocationAlertCard"

const meta = {
  title: "pages/allocations/AllocationAlertCard",
  component: AllocationAlertCard,
} satisfies Meta<typeof AllocationAlertCard>

export default meta

const statuses = ["info", "warning", "error", "success", "neutral"] as const

export const AllVariants = () => (
  <VStack gap="4" alignItems="stretch">
    <For each={statuses}>
      {status => (
        <AllocationAlertCard
          status={status}
          title={`${status.charAt(0).toUpperCase() + status.slice(1)} Title`}
          message="This is a toast message."
        />
      )}
    </For>
  </VStack>
)

export const WithTitle = () => (
  <VStack gap="4" alignItems="stretch">
    <For each={statuses}>
      {status => (
        <AllocationAlertCard
          status={status}
          title={`${status.charAt(0).toUpperCase() + status.slice(1)} Title`}
          message="This is a message describing the alert content."
        />
      )}
    </For>
  </VStack>
)

export const WithoutTitle = () => (
  <VStack gap="4" alignItems="stretch">
    <For each={statuses}>
      {status => <AllocationAlertCard status={status} message={`This is a ${status} message without a title.`} />}
    </For>
  </VStack>
)

export const MultilineContent = () => (
  <VStack gap="4" alignItems="stretch">
    <AllocationAlertCard
      status="info"
      message={
        <VStack alignItems="flex-start" gap="1">
          <Text textStyle={{ base: "sm", md: "md" }} fontWeight="semibold">
            You can select maximum 15 apps.
          </Text>
          <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
            To select more apps you need to disable automation in your account settings.
          </Text>
        </VStack>
      }
    />
    <AllocationAlertCard
      status="warning"
      message={
        <VStack alignItems="flex-start" gap="1">
          <Text textStyle={{ base: "sm", md: "md" }} fontWeight="semibold">
            Your voting power is low
          </Text>
          <Text textStyle={{ base: "xs", md: "sm" }} color="text.subtle">
            Consider staking more B3TR tokens to increase your voting power and potential rewards.
          </Text>
        </VStack>
      }
    />
  </VStack>
)

export const RealWorldExamples = () => (
  <VStack gap="4" alignItems="stretch">
    <AllocationAlertCard
      status="info"
      title="Round in progress"
      message="You can change your vote allocation until the round ends."
    />
    <AllocationAlertCard
      status="warning"
      title="Time running out"
      message="Only 2 hours left to cast your vote in this round."
    />
    <AllocationAlertCard
      status="success"
      title="Vote submitted successfully"
      message="Your allocation has been recorded and will be counted at the end of this round."
    />
    <AllocationAlertCard
      status="error"
      title="Transaction failed"
      message="Unable to submit your vote. Please check your wallet connection and try again."
    />
    <AllocationAlertCard
      status="neutral"
      title="System notification"
      message="This is a general notification message for informational purposes."
    />
  </VStack>
)

export const DarkMode = () => cloneElement(<AllVariants />)
DarkMode.globals = { theme: "dark" }
