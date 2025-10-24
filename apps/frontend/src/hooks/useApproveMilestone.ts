import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts/factories/GrantsManager__factory"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAllMilestoneStatesQueryKey } from "./proposals/grants/useAllMilestoneStates"
import { getMilestoneStateQueryKey } from "./proposals/grants/useMilestoneState"
import { useBuildTransaction } from "./useBuildTransaction"

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
  const refetchQueryKeys = useMemo(
    () => [getAllMilestoneStatesQueryKey(proposalId), getMilestoneStateQueryKey(proposalId, milestoneIndex)],
    [proposalId, milestoneIndex],
  )
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
