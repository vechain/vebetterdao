import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const governorInterface = B3TRGovernor__factory.createInterface()

/**
 * Get if a proposal can start in the next round
 * @param thor  the thor client
 * @returns  if a proposal can start in the next round
 */
export const getCanProposalStartInNextRound = async (thor: Connex.Thor): Promise<boolean> => {
  const functionFragment = governorInterface.getFunction("canProposalStartInNextRound").format("json")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getCanProposalStartInNextRoundQueryKey = () => ["proposals", "canStartInNextRound"]

/**
 *  Hook to get if a proposal can start in the next round
 * @returns if a proposal can start in the next round
 */
export const useCanProposalStartInNextRound = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getCanProposalStartInNextRoundQueryKey(),
    queryFn: async () => await getCanProposalStartInNextRound(thor),
    enabled: !!thor && thor.status.head.number > 0,
  })
}
