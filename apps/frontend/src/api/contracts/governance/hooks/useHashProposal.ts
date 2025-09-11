import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { ProposalAction, ReducedActions } from "@/hooks"

const abi = B3TRGovernor__factory.abi
const method = "hashProposal" as const
const address = getConfig().b3trGovernorAddress as `0x${string}`

const transformActions = (actions: ProposalAction[]) =>
  actions.reduce<ReducedActions>(
    (acc, action) => {
      acc.contractsAddress.push(action.contractAddress)
      acc.calldatas.push(action.calldata)
      return acc
    },
    { contractsAddress: [] as `0x${string}`[], calldatas: [] as `0x${string}`[] },
  )

export const getHashProposalQueryKey = (actions: ProposalAction[], descriptionHash: string) => {
  const targetsAndCalldata = transformActions(actions)

  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [
      targetsAndCalldata.contractsAddress as `0x${string}`[],
      Array(actions.length).fill(0),
      targetsAndCalldata.calldatas as `0x${string}`[],
      descriptionHash as `0x${string}`,
    ],
  })
}
/**
 * Hook to get the proposal id by hashing the proposal data.
 * @param actions - The actions to be executed if the proposal is successful.
 * @param descriptionHash - The hash of the proposal description.
 * @returns The proposal id.
 */
export const useHashProposal = (actions: ProposalAction[], descriptionHash: string) => {
  const targetsAndCalldata = transformActions(actions)

  return useCallClause({
    abi,
    address,
    method,
    args: [
      targetsAndCalldata.contractsAddress as `0x${string}`[],
      Array(actions.length).fill(0),
      targetsAndCalldata.calldatas as `0x${string}`[],
      descriptionHash as `0x${string}`,
    ],
    queryOptions: {
      enabled: descriptionHash !== "",
      select: data => data[0].toString(),
    },
  })
}
