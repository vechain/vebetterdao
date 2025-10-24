import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalClaimableUserDepositsQueryKey } from "../api/contracts/governance/hooks/useProposalClaimableUserDeposits"
import { getProposalStateQueryKey } from "../api/contracts/governance/hooks/useProposalState"

import { useProposalEnrichedById } from "./proposals/common/useProposalEnrichedById"
import { useBuildTransaction } from "./useBuildTransaction"

const GovernorInterface = B3TRGovernor__factory.createInterface()
type Props = { proposalId: string; onSuccess?: () => void }
export const useCancelProposal = ({ proposalId, onSuccess }: Props) => {
  const { account } = useWallet()
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
        method: "cancel",
        args: [
          proposal?.targets,
          values,
          proposal?.calldatas,
          ethers.keccak256(ethers.toUtf8Bytes(proposal?.ipfsDescription || "")),
        ],
        comment: "cancel proposal",
      }),
    ]
  }, [proposal?.calldatas, proposal?.ipfsDescription, proposal?.targets, values])
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
