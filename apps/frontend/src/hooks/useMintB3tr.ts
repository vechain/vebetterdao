import { getB3TrTokenDetailsQueryKey, getB3TrBalanceQueryKey, buildMintB3trTx, useB3trTokenDetails } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { FormattingUtils } from "@repo/utils"

type useMintB3trProps = {
  address?: string
  amount?: string | number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to mint a certain amount of B3TR tokens
 * This hook will send a mint transaction to the blockchain and wait for the txConfirmation
 * @param address the address to mint the tokens to
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useMintB3tr = ({
  address,
  amount,
  onSuccess,
  invalidateCache = true,
}: useMintB3trProps): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: tokenDetails } = useB3trTokenDetails()

  const buildClauses = useCallback(() => {
    if (!address) throw new Error("address is required")
    if (!amount) throw new Error("amount is required")
    if (!tokenDetails) throw new Error("tokenDetails is required")

    const clauses = buildMintB3trTx(thor, address, amount)
    return [clauses]
  }, [thor, address, amount, tokenDetails])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getB3TrTokenDetailsQueryKey(),
      })

      await queryClient.refetchQueries({
        queryKey: getB3TrTokenDetailsQueryKey(),
      })
      await queryClient.cancelQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })
      await queryClient.refetchQueries({
        queryKey: getB3TrBalanceQueryKey(account ?? undefined),
      })
    }

    const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
    const formattedAddress = FormattingUtils.humanAddress(address ?? "")

    toast({
      title: "Tokens minted succesfully",
      description: `You have minted ${formattedAmount} B3TR to ${formattedAddress}`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, account, amount, address])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
