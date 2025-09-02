import { useCallback, useMemo } from "react"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import { getAllProposalsStateQueryKey, getProposalClaimableUserDepositsQueryKey, getProposalStateQueryKey } from "@/api"
import { buildClause } from "@/utils/buildClause"
import { ethers } from "ethers"
import { useWallet } from "@vechain/vechain-kit"
import { useProposalEnrichedById } from "./proposals/common/useProposalEnrichedById"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type Props = { proposalId: string; onSuccess?: () => void }

export const useCancelProposal = ({ proposalId, onSuccess }: Props) => {
  const { account } = useWallet()

  const enrichedProposal = useProposalEnrichedById(proposalId)
  const proposal = enrichedProposal.proposal
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
        method: "cancel",
        args: [
          proposal?.targets,
          values,
          proposal?.calldatas,
          ethers.keccak256(ethers.toUtf8Bytes(proposal?.description || "")),
        ],
        comment: "cancel proposal",
      }),
    ]
  }, [proposal?.calldatas, proposal?.description, proposal?.targets, values])

  const refetchQueryKeys = useMemo(
    () => [
      getProposalStateQueryKey(proposalId),
      getAllProposalsStateQueryKey(),
      getProposalClaimableUserDepositsQueryKey(account?.address ?? ""),
    ],
    [proposalId, account?.address],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
