import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *  Get the number of votes for a xApp in a proposal (allocation round)
 * @param thor  the connex instance
 * @param xAppId  the xApp id to get the votes for
 * @param proposalId  the proposal id to get the votes for
 * @returns  the number of votes for the xApp in the proposal
 */
export const getXAppVotes = async (thor: Connex.Thor, xAppId: string, proposalId: string): Promise<string> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("getAppVotes").format("json")
  const res = await thor
    .account(XALLOCATIONVOTING_CONTRACT)
    .method(JSON.parse(functionFragment))
    .call(proposalId, xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getXAppVotesQueryKey = (xAppId: string, proposalId: string) => ["xApp", xAppId, "votes", proposalId]

/**
 * Get the number of votes for a xApp in a proposal (allocation round)
 * @param xAppId the xApp id to get the votes for
 * @param proposalId the proposal id to get the votes for
 * @returns the number of votes for the xApp in the proposal
 */
export const useXAppVotes = (xAppId: string, proposalId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getXAppVotesQueryKey(xAppId, proposalId),
    queryFn: async () => await getXAppVotes(thor, xAppId, proposalId),
    enabled: !!thor,
  })
}
