import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"

import { useEvents } from "../../../../hooks/useEvents"

const abi = VeBetterPassport__factory.abi
const contractAddress = getConfig().veBetterPassportContractAddress
/**
 * Custom hook to fetch the SignalerAssignedToApp events.
 * @param appId - The id of the app to fetch the signalers for.
 */
export const useSignalerAssignedToApp = (appId: string) => {
  const filterParams = { app: appId }
  const rawSignalerAssignedToAppEvents = useEvents({
    contractAddress,
    abi,
    eventName: "SignalerAssignedToApp",
    filterParams,
    select: events =>
      events.map(({ decodedData, meta }) => ({
        signaler: decodedData.args.signaler,
        appId: decodedData.args.app,
        blockNumber: meta.blockNumber,
        txOrigin: meta.txOrigin,
      })),
  })
  const rawSignalerRemovedFromAppEvents = useEvents({
    contractAddress,
    abi,
    eventName: "SignalerRemovedFromApp",
    filterParams,
    select: events =>
      events.map(({ decodedData, meta }) => ({
        signaler: decodedData.args.signaler,
        appId: decodedData.args.app,
        blockNumber: meta.blockNumber,
        txOrigin: meta.txOrigin,
      })),
  })
  const signalerAssignedToAppEvents = rawSignalerAssignedToAppEvents.data || []
  const signalerRemovedFromAppEvents = rawSignalerRemovedFromAppEvents.data || []
  const isLoading = rawSignalerAssignedToAppEvents.isLoading || rawSignalerRemovedFromAppEvents.isLoading
  // Filter out signalers that have been removed
  // Consider active if no removal event exists OR the role assignment occurred again after the latest removal
  const activeSignalers = signalerAssignedToAppEvents
    .filter(assignEvent => {
      // Find the latest removal event for this signaler (if any)
      const latestRemoval = signalerRemovedFromAppEvents
        .filter(removedEvent => removedEvent.signaler === assignEvent.signaler)
        .sort((a, b) => b.blockNumber - a.blockNumber)[0]

      return !latestRemoval || assignEvent.blockNumber > latestRemoval.blockNumber
    })
    // Extract the signaler addresses ONLY
    .map(event => event.signaler)

  return {
    isLoading,
    data: {
      activeSignalers,
    },
  }
}
