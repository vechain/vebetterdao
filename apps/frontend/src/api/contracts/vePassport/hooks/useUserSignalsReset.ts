import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useMemo } from "react"

import { useEvents } from "../../../../hooks/useEvents"

const abi = VeBetterPassport__factory.abi
const contractAddress = getConfig().veBetterPassportContractAddress
/**
 * Custom hook to fetch the UserSignalsReset events.
 * @param walletAddress - The wallet address to fetch the events for.
 */
export const useUserSignalsReset = (walletAddress?: string) => {
  const filterParams = { user: walletAddress }
  const rawUserSignalsResetEvents = useEvents({
    contractAddress,
    abi,
    eventName: "UserSignalsReset",
    filterParams,
    select: events =>
      events.map(({ decodedData, meta }) => ({
        user: decodedData.args.user,
        blockNumber: meta.blockNumber,
        txOrigin: meta.txOrigin,
      })),
    enabled: !!walletAddress,
  })
  const isLoading = rawUserSignalsResetEvents.isLoading
  const userSignalsResetEvents = useMemo(() => {
    return rawUserSignalsResetEvents.data?.filter(event => event.user === walletAddress)
  }, [rawUserSignalsResetEvents, walletAddress])
  return {
    isLoading,
    data: {
      userSignalsResetEvents,
    },
  }
}
