import { getProposalUserDepositQueryKey, useVot3TokenDetails } from "@/api"
import { UseSendTransactionReturnValue } from "./useSendTransaction"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { removingExcessDecimals } from "@/utils/MathUtils"
import { B3TRGovernor__factory, VOT3__factory } from "@repo/contracts"
import { scaleNumberUp } from "@repo/utils/FormattingUtils"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getProposalDepositQueryKey } from "@/api/contracts/governance/hooks/useGetProposalDeposit"
import { getIsDepositReachedQueryKey } from "@/api/contracts/governance/hooks/useIsDepositReached"

const config = getConfig()

const Vot3Interface = VOT3__factory.createInterface()
const VOT3_CONTRACT = config.vot3ContractAddress

const GovernorInterface = B3TRGovernor__factory.createInterface()
const GOVERNANCE_CONTRACT = config.b3trGovernorAddress

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
  const { data: tokenDetails } = useVot3TokenDetails()

  const clauseBuilder = useCallback(
    ({ amount, proposalId }: { amount: string | number; proposalId: string }) => {
      const contractAmount = removingExcessDecimals(amount, tokenDetails?.decimals)
      const amountWithDecimals = scaleNumberUp(
        contractAmount,
        tokenDetails?.decimals || 18,
        tokenDetails?.decimals || 18,
      )

      return [
        buildClause({
          contractInterface: Vot3Interface,
          to: VOT3_CONTRACT,
          method: "approve",
          args: [GOVERNANCE_CONTRACT, amountWithDecimals],
          comment: `Approve to transfer ${amount} VOT3`,
        }),
        buildClause({
          contractInterface: GovernorInterface,
          to: GOVERNANCE_CONTRACT,
          method: "deposit",
          args: [amountWithDecimals, proposalId],
          comment: `${amountWithDecimals} Vot3 deposited to proposal ${proposalId}`,
        }),
      ]
    },
    [tokenDetails],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getProposalUserDepositQueryKey(proposalId, account ?? ""),
      getProposalDepositQueryKey(proposalId),
      getIsDepositReachedQueryKey(proposalId),
    ],
    [account, proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
