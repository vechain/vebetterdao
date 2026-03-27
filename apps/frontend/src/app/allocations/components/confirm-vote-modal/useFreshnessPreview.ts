"use client"

import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useFreshnessMultipliers } from "@/api/contracts/xAllocations/hooks/useFreshnessMultiplier"
import { useEvents } from "@/hooks/useEvents"

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress

/**
 * Compute XOR fingerprint of app IDs (same algorithm as FreshnessUtils.sol)
 */
function computeFingerprint(appIds: string[]): string {
  if (appIds.length === 0) return "0x" + "00".repeat(32)

  let result = BigInt(0)
  for (const id of appIds) {
    result ^= BigInt(id)
  }
  return "0x" + result.toString(16).padStart(64, "0")
}

interface FreshnessPreview {
  /** Whether the current selection is different from the last vote */
  isUpdated: boolean
  /** The multiplier tier label (e.g., "x3", "x2", "x1") */
  tierLabel: string
  /** Whether this is a first-time voter (no previous freshness event) */
  isFirstVote: boolean
  /** Whether the data is still loading */
  isLoading: boolean
}

/**
 * Hook that previews the freshness multiplier the user will receive based on their current app selection.
 * Computes the XOR fingerprint client-side and compares against the last FreshnessMultiplierApplied event.
 */
export function useFreshnessPreview(
  selectedAppIds: string[],
  roundId: string,
  snapshotBlock?: string,
): FreshnessPreview {
  const { account } = useWallet()

  // Read FreshnessMultiplierApplied events for this user across recent rounds
  const { data: freshnessEvents, isLoading: isEventsLoading } = useEvents({
    abi,
    contractAddress,
    eventName: "FreshnessMultiplierApplied",
    filterParams: { voter: (account?.address ?? "") as `0x${string}` },
    select: events =>
      events.map(({ decodedData }) => ({
        roundId: Number(decodedData.args.roundId),
        fingerprint: decodedData.args.fingerprint as string,
        lastChangedRound: Number(decodedData.args.lastChangedRound),
        multiplier: Number(decodedData.args.multiplier),
      })),
    enabled: !!account?.address,
  })

  // Get multiplier config at snapshot
  const { data: multipliersData, isLoading: isMultipliersLoading } = useFreshnessMultipliers(snapshotBlock)

  return useMemo(() => {
    const isLoading = isEventsLoading || isMultipliersLoading

    if (isLoading || !account?.address) {
      return { isUpdated: false, tierLabel: "x1", isFirstVote: false, isLoading: true }
    }

    // Get multiplier tiers from config (default to standard values)
    const tier1 = multipliersData ? Number(multipliersData[0]) : 30000
    const tier2 = multipliersData ? Number(multipliersData[1]) : 20000
    const tier3 = multipliersData ? Number(multipliersData[2]) : 10000

    const currentRound = Number(roundId)

    // Compute current fingerprint from selected apps
    const currentFingerprint = computeFingerprint(selectedAppIds)

    // Find the most recent freshness event (latest round)
    const sortedEvents = [...(freshnessEvents || [])].sort((a, b) => b.roundId - a.roundId)
    const lastEvent = sortedEvents[0]

    // First-time voter — no previous events
    if (!lastEvent) {
      return {
        isUpdated: true,
        tierLabel: `x${tier1 / 10000}`,
        isFirstVote: true,
        isLoading: false,
      }
    }

    // Compare fingerprints
    const isFingerPrintChanged = currentFingerprint.toLowerCase() !== lastEvent.fingerprint.toLowerCase()

    // Calculate what the multiplier would be
    const lastChangedRound = isFingerPrintChanged ? currentRound : lastEvent.lastChangedRound
    const roundsSinceChange = currentRound - lastChangedRound

    let multiplier: number
    if (roundsSinceChange === 0) {
      multiplier = tier1
    } else if (roundsSinceChange === 1) {
      multiplier = tier2
    } else {
      multiplier = tier3
    }

    return {
      isUpdated: isFingerPrintChanged,
      tierLabel: `x${multiplier / 10000}`,
      isFirstVote: false,
      isLoading: false,
    }
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
