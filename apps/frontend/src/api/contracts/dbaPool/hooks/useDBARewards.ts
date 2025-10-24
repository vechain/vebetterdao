import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { DBAPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { decodeEventLog, useThor } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const abi = DBAPool__factory.abi
const address = getConfig().dbaPoolContractAddress as `0x${string}`
const eventName = "FundsDistributedToApp" as const

/**
 * Hook to fetch DBA rewards distributed to an app for a specific round
 * Reads the FundsDistributedToApp event from the DBAPool contract
 * @param roundId The round ID to check
 * @param xAppId The app ID to check
 * @returns The amount of DBA rewards distributed to the app (in ether format) or "0" if no rewards
 */
export const useDBARewards = (roundId: string | number, xAppId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: ["dbaRewards", roundId, xAppId, address],
    queryFn: async () => {
      try {
        const eventAbi = thor.contracts.load(address, abi).getEventAbi(eventName)

        // Encode filter topics for the specific appId and roundId
        // The event signature is: FundsDistributedToApp(bytes32 indexed appId, uint256 amount, uint256 indexed roundId)
        const topics = eventAbi.encodeFilterTopicsNoNull({ appId: xAppId, roundId: BigInt(roundId) })

        // Query events - filtering by both appId and roundId should return at most 1 event
        const [eventLog] = await thor.logs.filterEventLogs({
          criteriaSet: [
            {
              criteria: {
                address,
                topic0: topics[0] ?? undefined,
                topic1: topics[1] ?? undefined,
                topic2: topics[2] ?? undefined,
              },
              eventAbi,
            },
          ],
          options: {
            offset: 0,
            limit: 1,
          },
          order: "desc",
        })

        if (!eventLog) {
          return {
            amount: "0",
            appId: xAppId,
            hasRewards: false,
          }
        }

        const event = decodeEventLog(eventLog, abi)

        if (event.decodedData.eventName !== eventName) {
          return {
            amount: "0",
            appId: xAppId,
            hasRewards: false,
          }
        }

        // Extract amount from event
        const amount = event.decodedData.args.amount

        return {
          amount: formatEther(amount),
          appId: xAppId,
          hasRewards: true,
        }
      } catch (error) {
        console.error("Error fetching DBA rewards:", error)
        return {
          amount: "0",
          appId: xAppId,
          hasRewards: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    },
    enabled: !!roundId && !!xAppId && !!thor,
  })
}
