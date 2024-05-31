import { getProposalUserDepositQueryKey } from "@/api"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"

const config = getConfig()

const GovernorInterface = B3TRGovernor__factory.createInterface()
const GOVERNANCE_CONTRACT = config.b3trGovernorAddress

type UseProposalVot3DepositProps = {
  proposalId: string
  onSuccess?: () => void
}

/**
 * Custom hook for withdrawing a deposit from a proposal.
 *
 * @param {Object} props - The hook props.
 * @param {string} props.proposalId - The ID of the proposal.
 * @param {Function} [props.onSuccess] - Optional callback function to be called on successful withdrawal.
 * @returns {Object} - The result of the hook.
 */
export const useWithdrawDeposit = ({ proposalId, onSuccess }: UseProposalVot3DepositProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        contractInterface: GovernorInterface,
        to: GOVERNANCE_CONTRACT,
        method: "withdraw",
        args: [proposalId, account],
        comment: `withdraw deposited vot3 of proposal ${proposalId}`,
      }),
    ]
  }, [account, proposalId])

  const refetchQueryKeys = useMemo(
    () => [getProposalUserDepositQueryKey(proposalId, account ?? "")],
    [account, proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
