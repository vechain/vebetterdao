import {
  getGetProposalDepositsQueryKey,
  getProposalClaimableUserDepositsQueryKey,
  getProposalsEventsQueryKey,
  getProposalUserDepositQueryKey,
} from "@/api"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { VOT3__factory } from "@vechain/vebetterdao-contracts/factories/VOT3__factory"
import { buildClause } from "@/utils/buildClause"
import { getIsDepositReachedQueryKey } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { useBuildTransaction } from "./useBuildTransaction"
import { getVot3BalanceQueryKey } from "./useGetVot3Balance"

const config = getConfig()

const Vot3Interface = VOT3__factory.createInterface()
const VOT3_CONTRACT = config.vot3ContractAddress

const GovernorInterface = B3TRGovernor__factory.createInterface()
const GOVERNANCE_CONTRACT = config.b3trGovernorAddress

// const buffer = 1.01
// Derived from mainnet onchain txs https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1723109024015819?thread_ts=1723106964.183119&cid=C06BLEJE5SA
// const suggestedMaxGas = 157424 * buffer

type UseProposalVot3DepositProps = {
  proposalId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

export const useProposalVot3Deposit = ({
  proposalId,
  onSuccess,
  transactionModalCustomUI,
}: UseProposalVot3DepositProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(({ amount, proposalId }: { amount: string | number; proposalId: string }) => {
    return [
      buildClause({
        contractInterface: Vot3Interface,
        to: VOT3_CONTRACT,
        method: "approve",
        args: [GOVERNANCE_CONTRACT, amount],
        comment: `Approve to transfer ${ethers.formatEther(amount)} VOT3`,
      }),
      buildClause({
        contractInterface: GovernorInterface,
        to: GOVERNANCE_CONTRACT,
        method: "deposit",
        args: [amount, proposalId],
        comment: `${ethers.formatEther(amount)} Vot3 deposited to proposal ${proposalId}`,
      }),
    ]
  }, [])

  const refetchQueryKeys = useMemo(
    () => [
      getProposalUserDepositQueryKey(proposalId, account?.address ?? ""),
      getProposalClaimableUserDepositsQueryKey(account?.address ?? ""),
      getIsDepositReachedQueryKey(proposalId),
      getProposalsEventsQueryKey(),
      getVot3BalanceQueryKey(account?.address ?? ""),
      getGetProposalDepositsQueryKey(proposalId),
    ],
    [account, proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
    // suggestedMaxGas,
  })
}
