import { getProposalUserDepositQueryKey, getProposalClaimableUserDepositsQueryKey } from "@/api"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"

const config = getConfig()

const GovernorInterface = B3TRGovernor__factory.createInterface()
const GOVERNANCE_CONTRACT = config.b3trGovernorAddress

// const buffer = 1.01
// Derived from mainnet onchain txs https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1723109024015819?thread_ts=1723106964.183119&cid=C06BLEJE5SA
// const suggestedMaxGas = 110712 * buffer

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
    if (!account?.address) throw new Error("address is required")
    return [
      buildClause({
        contractInterface: GovernorInterface,
        to: GOVERNANCE_CONTRACT,
        method: "withdraw",
        args: [proposalId, account?.address],
        comment: `withdraw deposited vot3 of proposal ${proposalId}`,
      }),
    ]
  }, [account, proposalId])

  const refetchQueryKeys = useMemo(
    () => [
      getProposalUserDepositQueryKey(proposalId, account?.address ?? ""),
      getProposalClaimableUserDepositsQueryKey(account?.address ?? ""),
    ],
    [account, proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    // suggestedMaxGas,
  })
}
