import { useMemo } from "react"
import { useEvents } from "@/hooks"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"

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
    mapResponse: ({ decodedData, meta }) => ({
      user: decodedData.args.user,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
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
