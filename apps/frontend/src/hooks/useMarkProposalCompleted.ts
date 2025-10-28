import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalStateQueryKey } from "../api/contracts/governance/hooks/useProposalState"

import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()
type Props = { proposalId: string; onSuccess?: () => void }
/**
 * Hook to mark a proposal as completed
 * @param proposalId  the proposal id to mark as completed
 * @param onSuccess  the callback to call after the proposal is marked as completed
 * @returns the mark completed transaction
 */
export const useMarkProposalCompleted = ({ proposalId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "markAsCompleted",
        args: [proposalId],
        comment: "mark proposal completed",
      }),
    ]
  }, [proposalId])
  const refetchQueryKeys = useMemo(
    () => [getProposalStateQueryKey(proposalId), getAllProposalsStateQueryKey()],
    [proposalId],
  )
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
