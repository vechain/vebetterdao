import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 * Hook to know if round is finalized
 *
 * @param roundId  the roundId the get the votes for
 * @returns if round is finalized
 */
export const getIsRoundFinalized = async (thor: Connex.Thor, roundId?: string): Promise<boolean> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("isFinalized").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getIsRoundFinalizedQueryKey = (roundId?: string) => ["isRoundFinalized", roundId]

/**
 * Hook to know if round is finalized
 *
 * @param roundId  the roundId the get the votes for
 * @returns if round is finalized
 */
export const useIsRoundFinalized = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsRoundFinalizedQueryKey(roundId),
    queryFn: async () => await getIsRoundFinalized(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
