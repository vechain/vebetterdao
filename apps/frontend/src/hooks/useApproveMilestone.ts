import { useCallback, useMemo } from "react"
import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "./useBuildTransaction"
import { getIsMilestoneClaimableQueryKey } from "./proposals/grants/useIsMilestoneClaimable"

const grantsManagerAddress = getConfig().grantsManagerContractAddress
const GrantsManagerInterface = GrantsManager__factory.createInterface()

type Props = { proposalId: string; milestoneIndex: number; onSuccess?: () => void }

/**
 * Hook to approve a Milestone
 * @param proposalId  the proposal id to approve
 * @param milestoneIndex  the milestone index to approve
 * @param onSuccess  the callback to call after the milestone is approved
 * @returns the approve transaction
 */
export const useApproveMilestone = ({ proposalId, milestoneIndex, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: grantsManagerAddress,
        contractInterface: GrantsManagerInterface,
        method: "approveMilestones",
        args: [proposalId, milestoneIndex],
        comment: `Approving Milestone ${milestoneIndex} for Grant ${proposalId}`,
      }),
    ]
  }, [proposalId, milestoneIndex])

  // TODO : Are they more keys to refetch ? ( state of the grant ? )
  const refetchQueryKeys = useMemo(
    () => [getIsMilestoneClaimableQueryKey(proposalId, milestoneIndex)],
    [proposalId, milestoneIndex],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
