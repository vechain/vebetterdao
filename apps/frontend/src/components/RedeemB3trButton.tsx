import { useB3trBalance, useB3trTokenDetails, useVot3Balance, useVot3TokenDetails } from "@/api"
import { useStakeB3tr, useUnstakeB3tr } from "@/hooks"
import { Button } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/dapp-kit-react"
import { memo, useMemo } from "react"

type Props = {}

export const RedeemB3trButton = memo(() => {
  const { account } = useWallet()
  const { data: balance, isLoading: isBalanceLoading } = useVot3Balance(account ?? undefined)
  const { data: tokenDetails, isLoading: isTokensDetailsLoading } = useVot3TokenDetails()

  const isLoading = isBalanceLoading || isTokensDetailsLoading

  const buttonDisabled = isLoading || !balance || balance === "0"

  const { formattedBalance, scaledBalance } = useMemo(() => {
    if (!balance) {
      return { formattedBalance: "0", scaledBalance: "0" }
    }

    const decimals = tokenDetails?.decimals ?? 18

    const scaledBalance = FormattingUtils.scaleNumberDown(balance, decimals)
    const formattedBalance = FormattingUtils.humanNumber(scaledBalance, scaledBalance)
    return { formattedBalance, scaledBalance }
  }, [tokenDetails, balance])

  const { sendTransaction, isTxReceiptLoading, sendTransactionPending, sendTransactionError } = useUnstakeB3tr({
    amount: scaledBalance,
  })

  const isButtonLoading = isTxReceiptLoading || sendTransactionPending

  return (
    <Button size="sm" isDisabled={buttonDisabled} onClick={() => sendTransaction()} isLoading={isButtonLoading}>
      Redeem
    </Button>
  )
})
