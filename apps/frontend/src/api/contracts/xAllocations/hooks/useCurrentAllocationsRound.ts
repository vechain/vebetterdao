import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import XAllocationsVotingContract from "@repo/contracts/artifacts/contracts/XAllocationVoting.sol/XAllocationVoting.json"
import { getConfig } from "@repo/config"
const xAllocationsVotingContractAbi = XAllocationsVotingContract.abi
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns the current roundId of allocations voting
 * @param thor  the thor client
 * @returns the current roundId of allocations voting
 */
export const getCurrentAllocationsRound = async (thor: Connex.Thor): Promise<string> => {
  const currentRoundAbi = xAllocationsVotingContractAbi.find(abi => abi.name === "currentRoundId")
  if (!currentRoundAbi) throw new Error("currentRoundId function not found")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(currentRoundAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getCurrentAllocationsRoundQueryKey = () => ["currentAllocationsRound"]

/**
 * Hook to get the current roundId of allocations voting
 * @returns  the current roundId of allocations voting
 */
export const useCurrentAllocationsRound = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getCurrentAllocationsRoundQueryKey(),
    queryFn: async () => await getCurrentAllocationsRound(thor),
    enabled: !!thor,
    staleTime: Infinity,
  })
}
