import { useB3trBalance, useB3trTokenDetails } from "@/api"
import { useStakeB3tr } from "@/hooks"
import { Button } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { memo, useMemo } from "react"

type Props = {}

const swapPercentage = 0.1

export const SwapB3trButton: React.FC<Props> = memo(() => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useB3trBalance(account ?? undefined)
  const { data: tokenDetails, isLoading: isTokensDetailsLoading } = useB3trTokenDetails()

  const isLoading = isBalanceLoading || isTokensDetailsLoading

  const buttonDisabled = isLoading || !balance || balance === "0"

  const { formattedBalance, scaledBalance } = useMemo(() => {
    if (!balance) {
      return { formattedBalance: "0", scaledBalance: "0" }
    }

    const balanceToSwap = Number(balance) * swapPercentage

    const decimals = tokenDetails?.decimals ?? 18

    const scaledBalance = FormattingUtils.scaleNumberDown(balanceToSwap, decimals)
    const formattedBalance = FormattingUtils.humanNumber(scaledBalance, scaledBalance)
    return { formattedBalance, scaledBalance }
  }, [tokenDetails, balance])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending, sendTransactionError } = useStakeB3tr({
    amount: scaledBalance,
  })

  const isButtonLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <Button size="sm" isDisabled={buttonDisabled} onClick={() => sendTransaction()} isLoading={isButtonLoading}>
      Swap
    </Button>
  )
})
