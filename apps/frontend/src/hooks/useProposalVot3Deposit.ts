import { buildVot3ApprovesTx, useVot3TokenDetails } from "@/api"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { removingExcessDecimals } from "@/utils/MathUtils"
import { B3TRGovernorJson } from "@repo/contracts"
import { scaleNumberUp } from "@repo/utils/FormattingUtils"

const config = getConfig()

const b3trGovernorAbi = B3TRGovernorJson.abi
const GOVERNANCE_CONTRACT = config.b3trGovernorAddress

type UseProposalVot3DepositProps = {
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
  onSuccess,
}: UseProposalVot3DepositProps): UseProposalVot3DepositReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()

  const { data: tokenDetails } = useVot3TokenDetails()

  const buildClauses = useCallback(
    ({ amount, proposalId }: { amount: string | number; proposalId: string }) => {
      const functionAbi = b3trGovernorAbi.find(e => e.name === "deposit")
      if (!functionAbi) throw new Error("Function abi not found for mint")

      const contractAmount = removingExcessDecimals(amount, tokenDetails?.decimals)
      const amountWithDecimals = scaleNumberUp(
        contractAmount,
        tokenDetails?.decimals || 18,
        tokenDetails?.decimals || 18,
      )

      const approveClause = buildVot3ApprovesTx(thor, contractAmount, GOVERNANCE_CONTRACT, tokenDetails?.decimals)

      const depositClause = thor
        .account(GOVERNANCE_CONTRACT)
        .method(functionAbi)
        .asClause(amountWithDecimals, proposalId)
      return [
        approveClause,
        {
          ...depositClause,
          comment: `${amountWithDecimals} Vot3 deposited to proposal ${proposalId}`,
          abi: functionAbi,
        },
      ]
    },
    [thor, tokenDetails],
  )

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: onSuccess,
  })

  const sendTransaction = useCallback(
    (props: SendTransactionProps) => {
      return result.sendTransaction(buildClauses(props))
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction }
}
