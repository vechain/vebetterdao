import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"
import { ethers } from "ethers"

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 * Get the quorum that needs to be reached for an allocation round
 *
 * @param roundId the round id
 *
 * @returns amount of votes needed to reach quorum
 */
export const getAllocationRoundQuorum = async (thor: Connex.Thor, roundId: string): Promise<string> => {
  const functionFragment = XAllocationVotingInterface.getFunction("roundQuorum").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return ethers.formatEther(res.decoded[0])
}

export const getAllocationRoundQuorumQueryKey = (roundId: string) => ["allocationRoundQuorum", roundId]

/**
 * Get the quorum that needs to be reached for an allocation round
 *
 * @param roundId the round id
 *
 * @returns amount of votes needed to reach quorum
 */
export const useAllocationRoundQuorum = (roundId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getAllocationRoundQuorumQueryKey(roundId),
    queryFn: async () => await getAllocationRoundQuorum(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
