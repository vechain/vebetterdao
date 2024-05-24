import { useCallback, useMemo } from "react"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { getProposalVotesQuerykey } from "@/api"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type ClausesProps = {
  proposalId: string
  vote: string
  comment: string
}

type Props = { proposalId: string; onSuccess?: () => void }

/**
 * Custom hook for casting a vote on a proposal.
 *
 * @param {string} proposalId - The ID of the proposal.
 *
 * @returns {ReturnType} - The return value of the custom hook.
 */
export const useProposalCastVote = ({ proposalId, onSuccess }: Props) => {
  const clauseBuilder = useCallback(({ proposalId, vote, comment }: ClausesProps) => {
    return [
      {
        to: getConfig().b3trGovernorAddress,
        value: 0,
        data: GovernorInterface.encodeFunctionData("castVoteWithReason", [proposalId, vote, comment]),
        comment: "cast proposal vote",
        abi: JSON.parse(JSON.stringify(GovernorInterface.getFunction("castVoteWithReason"))),
      },
    ]
  }, [])

  const refetchQueryKeys = useMemo(() => [getProposalVotesQuerykey(proposalId)], [proposalId])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
