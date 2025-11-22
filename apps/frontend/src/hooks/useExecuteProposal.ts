import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalStateQueryKey } from "../api/contracts/governance/hooks/useProposalState"

import { useBuildTransaction } from "./useBuildTransaction"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"

const GovernorInterface = B3TRGovernor__factory.createInterface()
type Props = { proposalId: string; onSuccess?: () => void }
/**
 * Hook to execute a proposal
 * @param proposalId  the proposal id to execute
 * @param onSuccess  the callback to call after the proposal is executed
 * @returns the execute transaction
 */
export const useExecuteProposal = ({ proposalId, onSuccess }: Props) => {
  const { data: proposal } = useProposalCreatedEvent(BigInt(proposalId))
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "execute",
        args: [
          proposal?.targets,
          proposal?.values,
          proposal?.calldatas,
          ethers.keccak256(ethers.toUtf8Bytes(proposal?.description || "")),
        ],
        comment: "execute proposal",
      }),
    ]
  }, [proposal?.calldatas, proposal?.description, proposal?.targets, proposal?.values])
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
