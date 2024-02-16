import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *  Get the number of votes for a xApp in an allocation round
 * @param thor  the connex instance
 * @param xAppId  the xApp id to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns  the number of votes for the xApp in the round
 */
export const getXAppVotes = async (thor: Connex.Thor, xAppId: string, roundId: string): Promise<string> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("getAppVotes").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getXAppVotesQueryKey = (xAppId?: string, roundId?: string) => [
  "allocationsRound",
  roundId,
  "votes",
  xAppId,
]

/**
 * Get the number of votes for a xApp in a round (allocation round)
 * @param xAppId the xApp id to get the votes for
 * @param roundId the round id to get the votes for
 * @returns the number of votes for the xApp in the round
 */
export const useXAppVotes = (xAppId: string, roundId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getXAppVotesQueryKey(xAppId, roundId),
    queryFn: async () => await getXAppVotes(thor, xAppId, roundId),
    enabled: !!thor,
  })
}
