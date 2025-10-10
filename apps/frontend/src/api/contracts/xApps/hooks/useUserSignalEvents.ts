import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"

import { useEvents } from "../../../../hooks/useEvents"

const abi = VeBetterPassport__factory.abi
const contractAddress = getConfig().veBetterPassportContractAddress
export type SignalEvent = {
  user: string
  appId: string
  reason: string
  blockNumber: number
  txOrigin: string
}
/**
 * Hook to get all the signal events for a user
 * @param user The user address to get the signal events for
 */
export const useUserSignalEvents = (user: string) => {
  const filterParams = { user }
  const rawSignaledEvents = useEvents({
    contractAddress,
    abi,
    eventName: "UserSignaled",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      user: decodedData.args.user,
      appId: decodedData.args.app,
      reason: decodedData.args.reason,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })
  const rawUnsignaledEvents = useEvents({
    contractAddress,
    abi,
    eventName: "UserSignalsResetForApp",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      user: decodedData.args.user,
      appId: decodedData.args.app,
      reason: decodedData.args.reason,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })
  const signaledEvents = rawSignaledEvents.data || []
  const unsignaledEvents = rawUnsignaledEvents.data || []
  const isLoading = rawSignaledEvents.isLoading || rawUnsignaledEvents.isLoading

  // Get the highest block number for each app that has been unsignaled
  const latestUnsignalByApp = new Map()
  for (const unsignal of unsignaledEvents) {
    const currentMaxBlock = latestUnsignalByApp.get(unsignal.appId) || 0
    latestUnsignalByApp.set(unsignal.appId, Math.max(currentMaxBlock, unsignal.blockNumber))
  }

  // If an app has been unsignaled, we only show the signaled events that happened after the unsignal
  const shouldKeepSignal = (event: SignalEvent) => {
    const latestUnsignalBlock = latestUnsignalByApp.get(event.appId)
    return !latestUnsignalBlock || event.blockNumber > latestUnsignalBlock
  }

  // Filter out signaled events that have been unsignaled
  const activeSignalEvents = signaledEvents.filter(shouldKeepSignal)

  return {
    isLoading,
    data: {
      activeSignalEvents,
      signaledEvents,
      unsignaledEvents,
    },
  }
}
