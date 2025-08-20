import { useCallback, useMemo } from "react"
import { B3TRGovernor__factory } from "@vechain-kit/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { getProposalStateQueryKey, useProposalCreatedEvent } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { ethers } from "ethers"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type Props = { proposalId: string; onSuccess?: () => void }

/**
 * Hook to execute a proposal
 * @param proposalId  the proposal id to execute
 * @param onSuccess  the callback to call after the proposal is executed
 * @returns the execute transaction
 */
export const useExecuteProposal = ({ proposalId, onSuccess }: Props) => {
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)

  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "execute",
        args: [
          proposalCreatedEvent.data?.targets,
          proposalCreatedEvent.data?.values,
          proposalCreatedEvent.data?.callDatas,
          ethers.keccak256(ethers.toUtf8Bytes(proposalCreatedEvent.data?.description || "")),
        ],
        comment: "execute proposal",
      }),
    ]
  }, [
    proposalCreatedEvent.data?.callDatas,
    proposalCreatedEvent.data?.description,
    proposalCreatedEvent.data?.targets,
    proposalCreatedEvent.data?.values,
  ])

  const refetchQueryKeys = useMemo(() => [getProposalStateQueryKey(proposalId)], [proposalId])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
