"use client"

import { Badge, Box, Card, HStack, IconButton, Input, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { LuSearch, LuX } from "react-icons/lu"

import { useCurrentRoundId } from "@/hooks/useCurrentRoundId"
import { useRelayerRegistration } from "@/hooks/useRelayerRegistration"
import { useRelayerRoundData } from "@/hooks/useRelayerRoundData"
import { useRoundRewardStatus } from "@/hooks/useRoundRewardStatus"
import { useTrackedRelayer } from "@/hooks/useTrackedRelayer"

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text textStyle="sm" fontWeight="bold" color="text.subtle" textTransform="uppercase" letterSpacing="wide">
      {children}
    </Text>
  )
}

function AddressInput({ onSubmit, initialValue }: { onSubmit: (address: string) => void; initialValue: string }) {
  const [value, setValue] = useState(initialValue)
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(value.trim())

  const handleSubmit = () => {
    if (isValid) onSubmit(value.trim())
  }

  return (
    <Card.Root variant="subtle" border="sm" borderColor="border.secondary" p={{ base: "4", md: "6" }}>
      <VStack align="stretch" gap="3">
        <Text textStyle={{ base: "md", md: "lg" }} fontWeight="bold">
          {"Track a Relayer"}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {"Enter a relayer address to view its overview, activity and rewards."}
        </Text>
        <HStack>
          <Input
            placeholder="0x..."
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            size="sm"
            fontFamily="mono"
          />
          <IconButton
            aria-label="Track relayer"
            variant="primary"
            size="sm"
            rounded="md"
            disabled={!isValid}
            onClick={handleSubmit}>
            <LuSearch />
          </IconButton>
        </HStack>
      </VStack>
    </Card.Root>
  )
}

/** Overview section: registration status, current round. */
function OverviewSection({ address, currentRoundId }: { address: string; currentRoundId: number | undefined }) {
  const { data: isRegistered, isLoading: regLoading } = useRelayerRegistration(address)

  const shortAddress = `${address.slice(0, 6)}\u2026${address.slice(-4)}`

  return (
    <VStack align="stretch" gap="2">
      <SectionTitle>{"Overview"}</SectionTitle>
      <DetailRow label="Address" value={shortAddress} />
      <HStack justify="space-between" w="full">
        <Text textStyle="sm" color="text.subtle">
          {"Registered"}
        </Text>
        <Skeleton loading={regLoading}>
          <Badge colorPalette={isRegistered ? "green" : "red"} size="sm">
            {isRegistered ? "Yes" : "No"}
          </Badge>
        </Skeleton>
      </HStack>
      <DetailRow label="Current round" value={currentRoundId != null ? String(currentRoundId) : "\u2014"} />
    </VStack>
  )
}

/** Activity section: actions + weighted actions for recent rounds. */
function ActivitySection({ address, currentRoundId }: { address: string; currentRoundId: number | undefined }) {
  const prevRoundId = currentRoundId != null ? currentRoundId - 1 : undefined
  const currentData = useRelayerRoundData(address, currentRoundId)
  const prevData = useRelayerRoundData(address, prevRoundId)

  return (
    <VStack align="stretch" gap="2">
      <SectionTitle>{"Activity"}</SectionTitle>
      {currentRoundId != null && (
        <>
          <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
            {`Round ${currentRoundId} (current)`}
          </Text>
          <DetailRow
            label="Actions"
            value={currentData.actions != null ? String(currentData.actions) : "\u2014"}
            isLoading={currentData.isLoading}
          />
          <DetailRow
            label="Weighted actions"
            value={currentData.weightedActions != null ? String(currentData.weightedActions) : "\u2014"}
            isLoading={currentData.isLoading}
          />
        </>
      )}
      {prevRoundId != null && prevRoundId > 0 && (
        <>
          <Box pt="1" />
          <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
            {`Round ${prevRoundId} (previous)`}
          </Text>
          <DetailRow
            label="Actions"
            value={prevData.actions != null ? String(prevData.actions) : "\u2014"}
            isLoading={prevData.isLoading}
          />
          <DetailRow
            label="Weighted actions"
            value={prevData.weightedActions != null ? String(prevData.weightedActions) : "\u2014"}
            isLoading={prevData.isLoading}
          />
        </>
      )}
    </VStack>
  )
}

/** Rewards section: claimable + pool totals for recent rounds. */
function RewardsSection({ address, currentRoundId }: { address: string; currentRoundId: number | undefined }) {
  const prevRoundId = currentRoundId != null ? currentRoundId - 1 : undefined
  const prevPrevRoundId = prevRoundId != null && prevRoundId > 1 ? prevRoundId - 1 : undefined

  const prevData = useRelayerRoundData(address, prevRoundId)
  const prevPrevData = useRelayerRoundData(address, prevPrevRoundId)
  const prevPoolStatus = useRoundRewardStatus(prevRoundId)
  const prevPrevPoolStatus = useRoundRewardStatus(prevPrevRoundId)

  return (
    <VStack align="stretch" gap="2">
      <SectionTitle>{"Rewards"}</SectionTitle>

      {prevRoundId != null && prevRoundId > 0 && (
        <>
          <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
            {`Round ${prevRoundId}`}
          </Text>
          <DetailRow
            label="Pool total"
            value={prevPoolStatus.totalRewardsFormatted ?? "\u2014"}
            isLoading={prevPoolStatus.isLoading}
          />
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="text.subtle">
              {"Pool claimable"}
            </Text>
            <Skeleton loading={prevPoolStatus.isLoading}>
              <Badge colorPalette={prevPoolStatus.claimable ? "green" : "yellow"} size="sm">
                {prevPoolStatus.claimable ? "Yes" : "Not yet"}
              </Badge>
            </Skeleton>
          </HStack>
          <DetailRow
            label="Your claimable"
            value={prevData.claimableFormatted ?? "\u2014"}
            isLoading={prevData.isLoading}
          />
        </>
      )}

      {prevPrevRoundId != null && prevPrevRoundId > 0 && (
        <>
          <Box pt="1" />
          <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
            {`Round ${prevPrevRoundId} (unclaimed?)`}
          </Text>
          <DetailRow
            label="Pool total"
            value={prevPrevPoolStatus.totalRewardsFormatted ?? "\u2014"}
            isLoading={prevPrevPoolStatus.isLoading}
          />
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="text.subtle">
              {"Pool claimable"}
            </Text>
            <Skeleton loading={prevPrevPoolStatus.isLoading}>
              <Badge colorPalette={prevPrevPoolStatus.claimable ? "green" : "yellow"} size="sm">
                {prevPrevPoolStatus.claimable ? "Yes" : "Not yet"}
              </Badge>
            </Skeleton>
          </HStack>
          <DetailRow
            label="Your claimable"
            value={prevPrevData.claimableFormatted ?? "\u2014"}
            isLoading={prevPrevData.isLoading}
          />
        </>
      )}

      <Text textStyle="xs" color="text.subtle" pt="1">
        {"Historical totals (all-time claimed) require indexer support."}
      </Text>
    </VStack>
  )
}

export function ConnectedWallet() {
  const { address, setAddress, clear, hasAddress } = useTrackedRelayer()
  const { data: currentRoundId } = useCurrentRoundId()

  if (!hasAddress) {
    return <AddressInput onSubmit={setAddress} initialValue="" />
  }

  return (
    <Card.Root variant="primary" p={{ base: "4", md: "6" }}>
      <VStack align="stretch" gap="4">
        {/* Header with change/remove */}
        <HStack justify="space-between" align="start">
          <Text textStyle={{ base: "md", md: "lg" }} fontWeight="bold">
            {"My Relayer"}
          </Text>
          <HStack gap="1">
            <IconButton aria-label="Change address" variant="ghost" size="xs" rounded="full" onClick={() => clear()}>
              <LuX size={16} />
            </IconButton>
          </HStack>
        </HStack>

        <OverviewSection address={address} currentRoundId={currentRoundId} />
        <Separator />
        <ActivitySection address={address} currentRoundId={currentRoundId} />
        <Separator />
        <RewardsSection address={address} currentRoundId={currentRoundId} />
      </VStack>
    </Card.Root>
  )
}
