import { FormattingUtils } from "@repo/utils"
import { useWallet, UseSendTransactionReturnValue, useThor } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { toaster } from "@/components/ui/toaster"

import { getB3TrTokenDetailsQueryKey } from "../api/contracts/b3tr/hooks/useB3trTokenDetails"
import { buildMintB3trTx } from "../api/contracts/b3tr/utils/buildMintB3trTx"

import { useBuildTransaction } from "./useBuildTransaction"
import { getB3trBalanceQueryKey } from "./useGetB3trBalance"

type useMintB3trProps = {
  address?: string
  amount?: string | number
  onSuccess?: () => void
}
/**
 * Hook to mint a certain amount of B3TR tokens
 * This hook will send a mint transaction to the blockchain and wait for the txConfirmation
 * @param address the address to mint the tokens to
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useMintB3tr = ({ address, amount, onSuccess }: useMintB3trProps): UseSendTransactionReturnValue => {
  const thor = useThor()
  const { account } = useWallet()
  const clauseBuilder = useCallback(() => {
    if (!address) throw new Error("address is required")
    if (!amount) throw new Error("amount is required")
    const clauses = buildMintB3trTx(thor, address, amount)
    return [clauses]
  }, [thor, address, amount])
  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
    const formattedAddress = FormattingUtils.humanAddress(address ?? "")
    toaster.success({
      title: "Tokens minted succesfully",
      description: `You have minted ${formattedAmount} B3TR to ${formattedAddress}`,
      duration: 5000,
      closable: true,
    })
    onSuccess?.()
  }, [onSuccess, amount, address])

  const refetchQueryKeys = useMemo(
    () => [getB3trBalanceQueryKey(account?.address ?? undefined), getB3TrTokenDetailsQueryKey()],
    [account?.address],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess: handleOnSuccess,
  })
}
