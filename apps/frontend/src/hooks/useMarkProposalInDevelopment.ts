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
 * Hook to mark a proposal as in development
 * @param proposalId  the proposal id to mark as in development
 * @param onSuccess  the callback to call after the proposal is marked as in development
 * @returns the mark in development transaction
 */
export const useMarkProposalInDevelopment = ({ proposalId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "markAsInDevelopment",
        args: [proposalId],
        comment: "mark proposal in development",
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
