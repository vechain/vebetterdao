import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { ProposalAction, ReducedActions } from "@/hooks"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const governorInterface = B3TRGovernor__factory.createInterface()

/**
 * Retrieves the proposal id by hashing the proposal data.
 * @param thor - The Connex.Thor instance.
 * @param actions - The actions to be executed if the proposal is successful.
 * @param descriptionHash - The hash of the proposal description.
 * @returns The proposal id.
 */
export const getHashProposal = async (
  thor: Connex.Thor,
  actions: ProposalAction[],
  descriptionHash: string,
): Promise<string> => {
  const targetsAndCalldata = actions.reduce<ReducedActions>(
    (acc, action) => {
      acc.contractsAddress.push(action.contractAddress)
      acc.calldatas.push(action.calldata)
      return acc
    },
    { contractsAddress: [], calldatas: [] },
  )

  const functionFragment = governorInterface.getFunction("hashProposal").format("json")
  const res = await thor
    .account(GOVERNANCE_CONTRACT)
    .method(JSON.parse(functionFragment))
    .call(
      targetsAndCalldata.contractsAddress,
      Array(actions.length).fill(0),
      targetsAndCalldata.calldatas,
      descriptionHash,
    )

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getHashProposalQueryKey = (actions: ProposalAction[], descriptionHash: string) => [
  "HASH_PROPOSAL",
  actions,
  descriptionHash,
]

/**
 * Hook to get the proposal id by hashing the proposal data.
 * @param actions - The actions to be executed if the proposal is successful.
 * @param descriptionHash - The hash of the proposal description.
 * @returns The proposal id.
 */
export const useHashProposal = (actions: ProposalAction[], descriptionHash: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getHashProposalQueryKey(actions, descriptionHash),
    queryFn: async () => await getHashProposal(thor, actions, descriptionHash),
    enabled: !!thor && thor.status.head.number > 0 && descriptionHash !== "",
  })
}
