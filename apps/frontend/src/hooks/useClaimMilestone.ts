import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"

import { getAllMilestoneStatesQueryKey } from "./proposals/grants/useAllMilestoneStates"
import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"

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
export const useClaimMilestone = ({ proposalId, milestoneIndex, onSuccess }: Props) => {
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
  const refetchQueryKeys = useMemo(
    () => [getAllMilestoneStatesQueryKey(proposalId), getAllProposalsStateQueryKey()],
    [proposalId],
  )
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
