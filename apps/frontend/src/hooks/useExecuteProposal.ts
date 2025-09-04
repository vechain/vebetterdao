import { getProposalStateQueryKey } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { useProposalEnrichedById } from "./proposals/common/useProposalEnrichedById"
import { useBuildTransaction } from "./useBuildTransaction"

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
  const proposalValues = proposal?.values

  const grantValues = useMemo(() => {
    return Array(proposal?.targets.length).fill("0")
  }, [proposal?.targets])
  const values = Array.isArray(proposalValues) ? proposalValues : grantValues

  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "execute",
        args: [
          proposal?.targets,
          values,
          proposal?.calldatas,
          ethers.keccak256(ethers.toUtf8Bytes(proposal?.description || "")),
        ],
        comment: "execute proposal",
      }),
    ]
  }, [proposal?.calldatas, proposal?.description, proposal?.targets, values])

  const refetchQueryKeys = useMemo(() => [getProposalStateQueryKey(proposalId)], [proposalId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
