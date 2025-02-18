import { useEvents } from "@/hooks"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"

const contractInterface = VeBetterPassport__factory.createInterface()
const contractAddress = getConfig().veBetterPassportContractAddress

/**
 * Hook to get all UserSignaled events for a given user
 * @param user The user address to get the events for
 * @returns The UserSignaled events for the given user
 */
export const useUserSignalEvents = (user: string) => {
  const filterParams = { user }
  return useEvents({
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
}
