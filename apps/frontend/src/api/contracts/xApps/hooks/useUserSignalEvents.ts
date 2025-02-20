import { useEvents } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"

const contractInterface = VeBetterPassport__factory.createInterface()
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
    contractInterface,
    event: "UserSignaled",
    filterParams,
    mapResponse: (decoded, meta) => ({
      user: decoded.user,
      appId: decoded.app,
      reason: decoded.reason,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })

  const rawUnsignaledEvents = useEvents({
    contractAddress,
    contractInterface,
    event: "UserSignalsResetForApp",
    filterParams,
    mapResponse: (decoded, meta) => ({
      user: decoded.user,
      appId: decoded.app,
      reason: decoded.reason,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })

  const signaledEvents = rawSignaledEvents.data || []
  const unsignaledEvents = rawUnsignaledEvents.data || []
  const isLoading = rawSignaledEvents.isLoading || rawUnsignaledEvents.isLoading

  // Get the highest block number for each app that has been unsignaled
  const unsignalBlockMap = new Map()
  for (const unsignal of unsignaledEvents) {
    const currentMaxBlock = unsignalBlockMap.get(unsignal.appId) || 0
    unsignalBlockMap.set(unsignal.appId, Math.max(currentMaxBlock, unsignal.blockNumber))
  }

  // Filter out signaled events that have been unsignaled
  // If an app has been unsignaled, we only show the signaled events that happened after the unsignal
  const activeSignalEvents = signaledEvents.filter(signaledEvent => {
    const resetBlock = unsignalBlockMap.get(signaledEvent.appId)
    return !resetBlock || signaledEvent.blockNumber > resetBlock
  })

  return {
    isLoading,
    data: {
      activeSignalEvents,
      signaledEvents,
      unsignaledEvents,
    },
  }
}
