"use client"

import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useFreshnessMultipliers } from "@/api/contracts/xAllocations/hooks/useFreshnessMultiplier"
import { useEvents } from "@/hooks/useEvents"

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress

// ======================== Pure helpers (testable) ======================== //

interface FreshnessEvent {
  roundId: number
  fingerprint: string
  lastChangedRound: number
  multiplier: number
}

interface MultiplierTiers {
  tier1: number
  tier2: number
  tier3: number
}

export interface FreshnessPreview {
  isUpdated: boolean
  tierLabel: string
  isFirstVote: boolean
  isLoading: boolean
}

const LOADING_STATE: FreshnessPreview = { isUpdated: false, tierLabel: "x1", isFirstVote: false, isLoading: true }

/**
 * Compute XOR fingerprint of app IDs (mirrors FreshnessUtils.sol on-chain logic).
 * Order-independent: voting [A, B] and [B, A] produce the same fingerprint.
 */
export function computeFingerprint(appIds: string[]): string {
  if (appIds.length === 0) return "0x" + "00".repeat(32)

  let result = BigInt(0)
  for (const id of appIds) {
    result ^= BigInt(id)
  }
  return "0x" + result.toString(16).padStart(64, "0")
}

/** Format a basis-points multiplier as a human-readable label (e.g., 30000 -> "x3") */
export function formatMultiplierLabel(basisPoints: number): string {
  return `x${basisPoints / 10000}`
}

/** Select the correct tier based on how many rounds since the last fingerprint change */
export function selectTier(roundsSinceChange: number, tiers: MultiplierTiers): number {
  if (roundsSinceChange === 0) return tiers.tier1
  if (roundsSinceChange === 1) return tiers.tier2
  return tiers.tier3
}

/** Find the most recent freshness event for the user */
function findLatestEvent(events: FreshnessEvent[]): FreshnessEvent | undefined {
  if (!events.length) return undefined
  return [...events].sort((a, b) => b.roundId - a.roundId)[0]
}

/**
 * Core resolution logic: given on-chain data, compute the freshness preview.
 * Extracted from useMemo for testability.
 */
export function resolveFreshnessPreview(
  selectedAppIds: string[],
  currentRound: number,
  events: FreshnessEvent[] | undefined,
  tiers: MultiplierTiers,
): FreshnessPreview {
  const currentFingerprint = computeFingerprint(selectedAppIds)
  const lastEvent = findLatestEvent(events || [])

  // First-time voter — no previous events
  if (!lastEvent) {
    return {
      isUpdated: true,
      tierLabel: formatMultiplierLabel(tiers.tier1),
      isFirstVote: true,
      isLoading: false,
    }
  }

  // Compare fingerprints to detect app selection change
  const isFingerprintChanged = currentFingerprint.toLowerCase() !== lastEvent.fingerprint.toLowerCase()

  // Determine the round when the fingerprint last changed
  const lastChangedRound = isFingerprintChanged ? currentRound : lastEvent.lastChangedRound
  const roundsSinceChange = currentRound - lastChangedRound

  const multiplier = selectTier(roundsSinceChange, tiers)

  return {
    isUpdated: isFingerprintChanged,
    tierLabel: formatMultiplierLabel(multiplier),
    isFirstVote: false,
    isLoading: false,
  }
}

// ======================== Hook ======================== //

/**
 * Previews the freshness multiplier the user will receive based on their current app selection.
 * Computes the XOR fingerprint client-side and compares against the last FreshnessMultiplierApplied event.
 */
export function useFreshnessPreview(
  selectedAppIds: string[],
  roundId: string,
  snapshotBlock?: string,
): FreshnessPreview {
  const { account } = useWallet()

  const { data: freshnessEvents, isLoading: isEventsLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "FreshnessMultiplierApplied",
    filterParams: { voter: (account?.address ?? "") as `0x${string}` },
    select: events =>
      events.map(
        ({ decodedData }): FreshnessEvent => ({
          roundId: Number(decodedData.args.roundId),
          fingerprint: decodedData.args.fingerprint as string,
          lastChangedRound: Number(decodedData.args.lastChangedRound),
          multiplier: Number(decodedData.args.multiplier),
        }),
      ),
    enabled: !!account?.address,
  })

  const { data: multipliersData, isLoading: isMultipliersLoading } = useFreshnessMultipliers(snapshotBlock)

  return useMemo(() => {
    if (isEventsLoading || isMultipliersLoading || !account?.address) return LOADING_STATE

    const tiers: MultiplierTiers = {
      tier1: multipliersData ? Number(multipliersData[0]) : 30000,
      tier2: multipliersData ? Number(multipliersData[1]) : 20000,
      tier3: multipliersData ? Number(multipliersData[2]) : 10000,
    }

    return resolveFreshnessPreview(selectedAppIds, Number(roundId), freshnessEvents, tiers)
  }, [
    selectedAppIds,
    roundId,
    freshnessEvents,
    multipliersData,
    account?.address,
    isEventsLoading,
    isMultipliersLoading,
  ])
}
