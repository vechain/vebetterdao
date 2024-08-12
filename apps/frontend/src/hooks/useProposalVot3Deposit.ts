import { getProposalsEventsQueryKey, getProposalUserDepositQueryKey, getVot3BalanceQueryKey } from "@/api"
import { UseSendTransactionReturnValue } from "./useSendTransaction"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory, VOT3__factory } from "@repo/contracts"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getProposalDepositQueryKey } from "@/api/contracts/governance/hooks/useGetProposalDeposit"
import { getIsDepositReachedQueryKey } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { ethers } from "ethers"

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
}

type SendTransactionProps = {
  amount: string | number
  proposalId: string
}

type UseProposalVot3DepositReturnValue = {
  sendTransaction: (props: SendTransactionProps) => void
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

export const useProposalVot3Deposit = ({
  proposalId,
  onSuccess,
}: UseProposalVot3DepositProps): UseProposalVot3DepositReturnValue => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(({ amount, proposalId }: { amount: string | number; proposalId: string }) => {
    return [
      buildClause({
        contractInterface: Vot3Interface,
        to: VOT3_CONTRACT,
        method: "approve",
        args: [GOVERNANCE_CONTRACT, amount],
        comment: `Approve to transfer ${amount} VOT3`,
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
      getProposalUserDepositQueryKey(proposalId, account ?? ""),
      getProposalDepositQueryKey(proposalId),
      getIsDepositReachedQueryKey(proposalId),
      getProposalsEventsQueryKey(),
      getVot3BalanceQueryKey(account ?? ""),
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
