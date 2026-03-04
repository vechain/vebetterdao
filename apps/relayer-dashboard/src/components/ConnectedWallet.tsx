"use client"

import { Card, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"

import { useRelayerStats } from "@/hooks/useRelayerStats"

function DetailRow({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  return (
    <HStack justify="space-between" w="full">
      <Text textStyle="sm" color="text.subtle">
        {label}
      </Text>
      <Skeleton loading={!!isLoading}>
        <Text textStyle="sm" fontWeight="semibold">
          {value}
        </Text>
      </Skeleton>
    </HStack>
  )
}

export function ConnectedWallet() {
  const {
    isConnected,
    address,
    currentRoundId,
    previousRoundClaimable,
    previousRoundRewards,
    previousRoundRewardsLoading,
  } = useRelayerStats()

  if (!isConnected) {
    return (
      <Card.Root variant="subtle" border="sm" borderColor="border.secondary" p={{ base: "4", md: "6" }}>
        <Text textStyle="sm" color="text.subtle">
          {
            "Connect your wallet to see relayer stats (claimable rewards, current round). Per-relayer totals (rewards claimed, VTHO spent) will be available when the indexer supports it."
          }
        </Text>
      </Card.Root>
    )
  }

  const shortAddress = address ? `${address.slice(0, 6)}\u2026${address.slice(-4)}` : ""

  return (
    <Card.Root variant="primary" p={{ base: "4", md: "6" }}>
      <VStack align="stretch" gap="4">
        <VStack align="start" gap="0">
          <Text textStyle={{ base: "md", md: "lg" }} fontWeight="bold">
            {"My relayer"}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {shortAddress}
          </Text>
        </VStack>

        <VStack align="stretch" gap="2">
          <DetailRow label="Current round" value={currentRoundId != null ? String(currentRoundId) : "\u2014"} />
          <DetailRow
            label={`Previous round (${(currentRoundId ?? 1) - 1}) claimable`}
            value={previousRoundClaimable ? "Yes" : "No"}
            isLoading={previousRoundRewardsLoading}
          />
          {previousRoundRewards != null && (
            <DetailRow
              label="Pool rewards (previous round)"
              value={previousRoundRewards}
              isLoading={previousRoundRewardsLoading}
            />
          )}
        </VStack>

        <Text textStyle="xs" color="text.subtle">
          {"Historical totals (rewards claimed, VTHO spent) require indexer support."}
        </Text>
      </VStack>
    </Card.Root>
  )
}
