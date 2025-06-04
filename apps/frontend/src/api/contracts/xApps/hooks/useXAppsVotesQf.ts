import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getXAppVotesQfQueryKey } from "./useXAppVotesQf"
import { XAllocationVotingGovernor__factory } from "@repo/contracts/typechain-types"
import { getConfig } from "@repo/config"

const ALLOCATION_VOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 * Get the quadratic funding votes for a single xApp in an allocation round
 * @param thor - The thor client
 * @param appId - The app ID to get votes for
 * @param roundId - The round ID to get votes for
 * @returns The number of quadratic funding votes for the app in the round
 */
export const getXAppVotesQf = async (thor: ThorClient, appId: string, roundId: string): Promise<string> => {
  const res = await thor.contracts
    .load(ALLOCATION_VOTING_CONTRACT, XAllocationVotingGovernor__factory.abi)
    .read.getAppVotesQF(roundId, appId)

  if (!res) throw new Error(`Failed to get QF votes for app ${appId} in round ${roundId}`)

  const votes = res[0] as bigint
  return (votes ** 2n).toString()
}

/**
 * Fetch the quadratic funding votes of multiple xApps in an allocation round
 * @param apps  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns  the number of quadratic funding votes for the xApps in the round
 */
export const useXAppsVotesQf = (apps: string[], roundId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getXAppVotesQfQueryKey(roundId),
    queryFn: async () => {
      const votes = []

      for (const app of apps) {
        try {
          const appVotes = await getXAppVotesQf(thor, app, roundId)
          votes.push({
            app,
            votes: appVotes,
          })
        } catch (error) {
          votes.push({
            app,
            votes: "0",
          })
        }
      }

      return votes
    },
    enabled: !!thor && !!roundId && !!apps.length,
  })
}
