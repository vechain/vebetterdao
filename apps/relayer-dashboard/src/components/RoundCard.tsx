"use client"

import { Badge, Box, Card, Collapsible, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"

import type { RoundAnalytics } from "@/lib/types"

interface RoundCardProps {
  round: RoundAnalytics
  defaultOpen?: boolean
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <HStack justify="space-between">
      <Text textStyle="sm" color="text.subtle">
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="semibold">
        {value}
      </Text>
    </HStack>
  )
}

export function RoundCard({ round, defaultOpen = false }: RoundCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card.Root variant="primary">
      <Collapsible.Root open={open} onOpenChange={d => setOpen(d.open)}>
        <Collapsible.Trigger asChild>
          <Card.Body cursor="pointer" _hover={{ bg: "card.hover" }} transition="background 0.15s">
            <HStack justify="space-between" w="full" flexWrap="wrap" gap="2">
              <HStack gap="3" flexWrap="wrap">
                <Text fontWeight="bold" textStyle={{ base: "md", md: "lg" }}>
                  {"#"}
                  {round.roundId}
                </Text>
                {round.isRoundEnded ? (
                  <Badge size="sm" variant="subtle" colorPalette="gray">
                    {"Concluded"}
                  </Badge>
                ) : (
                  <Badge size="sm" variant="solid" colorPalette="blue">
                    {"Active"}
                  </Badge>
                )}
              </HStack>
              <HStack gap={{ base: "3", md: "6" }} flexWrap="wrap">
                <VStack gap="0" align="end">
                  <Text textStyle="xs" color="text.subtle">
                    {"VTHO spent"}
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">
                    {round.vthoSpentTotal}
                  </Text>
                </VStack>
                <VStack gap="0" align="end">
                  <Text textStyle="xs" color="text.subtle">
                    {"Rewards"}
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">
                    {round.totalRelayerRewards}
                  </Text>
                </VStack>
                <Text color="text.subtle" textStyle="sm" alignSelf="center">
                  {open ? "\u25BE" : "\u25B8"}
                </Text>
              </HStack>
            </HStack>
          </Card.Body>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Box px="6" pb="4" pt="2" borderTopWidth="1px" borderColor="border.secondary">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
              <VStack gap="2" align="stretch">
                <DetailRow label="Auto-vote users" value={round.autoVotingUsersCount} />
                <DetailRow label="Voted for" value={round.votedForCount} />
                <DetailRow label="Rewards claimed" value={round.rewardsClaimedCount} />
                <DetailRow label="Relayers" value={round.numRelayers} />
              </VStack>
              <VStack gap="2" align="stretch">
                <DetailRow label="Expected actions" value={round.expectedActions} />
                <DetailRow label="Completed" value={round.completedActions} />
                <DetailRow label="Status" value={round.actionStatus} />
                <DetailRow label="VTHO (voting)" value={round.vthoSpentOnVoting} />
                <DetailRow label="VTHO (claiming)" value={round.vthoSpentOnClaiming} />
              </VStack>
            </SimpleGrid>
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Card.Root>
  )
}
