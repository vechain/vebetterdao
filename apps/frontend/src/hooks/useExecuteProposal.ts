import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalStateQueryKey } from "../api/contracts/governance/hooks/useProposalState"

import { useProposalEnrichedById } from "./proposals/common/useProposalEnrichedById"
import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"

const GovernorInterface = B3TRGovernor__factory.createInterface()
type Props = { proposalId: string; onSuccess?: () => void }
/**
 * Hook to execute a proposal
 * @param proposalId  the proposal id to execute
 * @param onSuccess  the callback to call after the proposal is executed
 * @returns the execute transaction
 */
export const useExecuteProposal = ({ proposalId, onSuccess }: Props) => {
  const { data: proposal } = useProposalEnrichedById(proposalId)
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
          ethers.keccak256(ethers.toUtf8Bytes(proposal?.ipfsDescription || "")),
        ],
        comment: "execute proposal",
      }),
    ]
  }, [proposal?.calldatas, proposal?.ipfsDescription, proposal?.targets, proposal?.values])
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
