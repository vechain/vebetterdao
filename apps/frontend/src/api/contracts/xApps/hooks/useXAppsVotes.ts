import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { XAllocationVotingGovernor__factory } from "@repo/contracts/typechain-types"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import { getXAppVotesQueryKey } from "./useXAppVotes"

const ALLOCATION_VOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 * Get the votes for a single xApp in an allocation round
 * @param thor - The thor client
 * @param appId - The app ID to get votes for
 * @param roundId - The round ID to get votes for
 * @returns The number of votes for the app in the round
 */
export const getXAppVotes = async (thor: ThorClient, appId: string, roundId: string): Promise<string> => {
  const res = await thor.contracts
    .load(ALLOCATION_VOTING_CONTRACT, XAllocationVotingGovernor__factory.abi)
    .read.getAppVotes(roundId, appId)

  if (!res) throw new Error(`Failed to get votes for app ${appId} in round ${roundId}`)

  return ethers.formatEther(res[0] as bigint)
}

/**
 * Fetch the votes of multiple xApps in an allocation round
 * @param apps  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns  the number of votes for the xApps in the round
 */
export const useXAppsVotes = (apps: string[], roundId: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getXAppVotesQueryKey(roundId),
    queryFn: async () => {
      const votes = []

      for (const app of apps) {
        try {
          const appVotes = await getXAppVotes(thor, app, roundId)
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
