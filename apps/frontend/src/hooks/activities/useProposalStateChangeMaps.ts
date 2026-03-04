import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useMemo } from "react"

import { useEvents } from "../useEvents"

const b3trGovernorAddress = getConfig().b3trGovernorAddress
const governorAbi = B3TRGovernor__factory.abi

const canceledAbi = [
  {
    type: "event",
    name: "ProposalCanceledWithReason",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "canceler", type: "address", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
] as const

const executedAbi = [
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ name: "proposalId", type: "uint256", indexed: false }],
  },
] as const

type TimestampMap = Map<string, number>

/**
 * Fetches all proposal state-change events and returns maps of proposalId → unix timestamp (seconds).
 * Used by activity hooks to show the date of the state change, not proposal creation.
 */
export const useProposalStateChangeMaps = () => {
  const canceledEvents = useEvents({
    abi: canceledAbi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalCanceledWithReason",
    select: events =>
      events.map(e => ({
        id: e.decodedData.args.proposalId.toString(),
        timestamp: e.meta.blockTimestamp,
        reason: e.decodedData.args.reason,
      })),
  })

  const inDevelopmentEvents = useEvents({
    abi: governorAbi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalInDevelopment",
    select: events =>
      events.map(e => ({
        id: e.decodedData.args.proposalId.toString(),
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const completedEvents = useEvents({
    abi: governorAbi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalCompleted",
    select: events =>
      events.map(e => ({
        id: e.decodedData.args.proposalId.toString(),
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const executedEvents = useEvents({
    abi: executedAbi,
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalExecuted",
    select: events =>
      events.map(e => ({
        id: e.decodedData.args.proposalId.toString(),
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const canceledMap = useMemo((): TimestampMap => {
    const map = new Map<string, number>()
    canceledEvents.data?.forEach(e => map.set(e.id, e.timestamp))
    return map
  }, [canceledEvents.data])

  const canceledReasonMap = useMemo((): Map<string, string> => {
    const map = new Map<string, string>()
    canceledEvents.data?.forEach(e => {
      if (e.reason) map.set(e.id, e.reason)
    })
    return map
  }, [canceledEvents.data])

  const inDevelopmentMap = useMemo((): TimestampMap => {
    const map = new Map<string, number>()
    inDevelopmentEvents.data?.forEach(e => map.set(e.id, e.timestamp))
    return map
  }, [inDevelopmentEvents.data])

  const completedMap = useMemo((): TimestampMap => {
    const map = new Map<string, number>()
    completedEvents.data?.forEach(e => map.set(e.id, e.timestamp))
    return map
  }, [completedEvents.data])

  const executedMap = useMemo((): TimestampMap => {
    const map = new Map<string, number>()
    executedEvents.data?.forEach(e => map.set(e.id, e.timestamp))
    return map
  }, [executedEvents.data])

  return {
    canceledMap,
    canceledReasonMap,
    inDevelopmentMap,
    completedMap,
    executedMap,
    isLoading:
      canceledEvents.isLoading ||
      inDevelopmentEvents.isLoading ||
      completedEvents.isLoading ||
      executedEvents.isLoading,
  }
}
