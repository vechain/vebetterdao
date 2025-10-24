import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"

import { getAllMilestoneStatesQueryKey } from "./proposals/grants/useAllMilestoneStates"
import { useBuildTransaction } from "./useBuildTransaction"

const grantsManagerAddress = getConfig().grantsManagerContractAddress
const GrantsManagerInterface = GrantsManager__factory.createInterface()
type Props = { proposalId: string; onSuccess?: () => void }
/**
 * Hook to reject a Grant
 * @param proposalId  the proposal id to reject
 * @param onSuccess  the callback to call after the grant is rejected
 * @returns the reject transaction
 */
export const useRejectGrant = ({ proposalId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: grantsManagerAddress,
        contractInterface: GrantsManagerInterface,
        method: "rejectMilestones",
        args: [proposalId],
        comment: `Rejecting Milestones for Grant ${proposalId}`,
      }),
    ]
  }, [proposalId])
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
