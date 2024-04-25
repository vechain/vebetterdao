import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTINGCONTRACT = getConfig().xAllocationVotingContractAddress

/**
 * Get the max percentage of shares that an xDapp can have in a given round
 *
 * @param thor  the thor client
 * @returns  the percentage of the total shares that an xDapp can have in a given round
 */
export const getAllocationSharesCap = async (thor: Connex.Thor, roundId: string): Promise<string> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("getRoundAppSharesCap").format("json")
  const res = await thor.account(XALLOCATIONVOTINGCONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationSharesCapQueryKey = () => ["allocationRound", "appSharesCap"]

/**
 * Get the max percetnage of shares that an xDapp can have in a given round
 *
 * @returns the percentage of the total shares that an xDapp can have
 */
export const useAllocationSharesCap = (roundId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationSharesCapQueryKey(),
    queryFn: async () => await getAllocationSharesCap(thor, roundId),
    enabled: !!thor,
  })
}