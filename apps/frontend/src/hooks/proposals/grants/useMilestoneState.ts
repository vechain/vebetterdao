import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().grantsManagerContractAddress
const abi = GrantsManager__factory.abi
const method = "milestoneState" as const
/**
 * Returns the query key to the milestone state
 * @returns The query key for fetching the milestone state.
 */
export const getMilestoneStateQueryKey = (proposalId: string, milestoneIndex: number) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId), BigInt(milestoneIndex)] })
type Props = {
  proposalId: string
  milestoneIndex: number
}
/**
 * Hook to return the state of a milestone
 * @returns milestone state
 */
export const useMilestoneState = ({ proposalId, milestoneIndex }: Props) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId), BigInt(milestoneIndex)],
    queryOptions: {
      select: res => {
        const contractState = res[0]
        return {
          state: contractState,
        }
      },
    },
  })
}
