import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"

const address = getConfig().grantsManagerContractAddress
const abi = GrantsManager__factory.abi
const method = "isClaimable" as const

/**
 * Returns the query key to whether the milestone is claimable
 * @returns The query key for fetching the milestone claimable status.
 */
export const getIsMilestoneClaimableQueryKey = (proposalId: string, milestoneIndex: number) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId), BigInt(milestoneIndex)] })

type Props = {
  proposalId: string
  milestoneIndex: number
}

/**
 * Hook to check if the milestone is claimable
 * @returns boolean indicating if the milestone is claimable
 */
export const useIsMilestoneClaimable = ({ proposalId, milestoneIndex }: Props) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId), BigInt(milestoneIndex)],
    queryOptions: {
      select: res => res[0] as boolean,
    },
  })
}
