"use client"

import { Icon, Text, Button, Dialog, Skeleton } from "@chakra-ui/react"
import { Flash } from "iconoir-react"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { StatCard } from "./StatCard"

export const VotingPowerBox = () => {
  const { isMobile } = useBreakpoints()
  const { vot3Balance, isLoading } = useVotingPowerAtSnapshot()

  const formatted = vot3Balance?.formatted ?? "0"

  return (
    <StatCard
      showIcon={!isMobile}
      variant="positive"
      title="Voting power"
      icon={<Flash />}
      subtitle={
        <Skeleton loading={isLoading}>
          <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="semibold">
            {formatted}
          </Text>
        </Skeleton>
      }
      cta={
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <Button variant="primary">
              <Icon as={Flash} boxSize="4" />
              {"Power up"}
            </Button>
          </Dialog.Trigger>
        </Dialog.Root>
      }
    />
  )
}
