import { useCallback, useMemo } from "react"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "./useBuildTransaction"
import { getMilestoneStateQueryKey } from "./proposals/grants/useMilestoneState"

const grantsManagerAddress = getConfig().grantsManagerContractAddress
const GrantsManagerInterface = GrantsManager__factory.createInterface()

type Props = { proposalId: string; milestoneIndex: number; onSuccess?: () => void }

/**
 * Hook to claim a Milestone
 * @param proposalId  the proposal id to claim
 * @param milestoneIndex  the milestone index to claim
 * @param onSuccess  the callback to call after the grant is claimed
 * @returns the claim transaction
 */
export const useClaimGrants = ({ proposalId, milestoneIndex, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: grantsManagerAddress,
        contractInterface: GrantsManagerInterface,
        method: "claimMilestone",
        args: [proposalId, milestoneIndex],
        comment: `Claiming Milestone ${milestoneIndex} for Proposal ${proposalId}`,
      }),
    ]
  }, [proposalId, milestoneIndex])

  // TODO(Grant) : Are they more refetch query ?
  const refetchQueryKeys = useMemo(
    () => [getMilestoneStateQueryKey(proposalId, milestoneIndex)],
    [proposalId, milestoneIndex],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
