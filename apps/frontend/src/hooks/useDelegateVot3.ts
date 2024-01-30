import {
  getB3TrTokenDetailsQueryKey,
  getB3TrBalanceQueryKey,
  buildMintB3trTx,
  useB3trTokenDetails,
  buildDelegateVot3Tx,
  getVot3DelegatesQueryKey,
} from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { FormattingUtils } from "@repo/utils"

type useMintB3trProps = {
  address?: string
  onSuccess?: () => void
  invalidateCache?: boolean
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
export const useDelegateVot3 = ({
  address,
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
    if (!tokenDetails) throw new Error("tokenDetails is required")

    const clauses = buildDelegateVot3Tx(thor, address)
    return [clauses]
  }, [thor, address])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getVot3DelegatesQueryKey(account ?? ""),
      })

      await queryClient.refetchQueries({
        queryKey: getVot3DelegatesQueryKey(account ?? ""),
      })
    }

    const formattedAddress = FormattingUtils.humanAddress(address ?? "")

    toast({
      title: "Vot3 delegated succesfully",
      description: `${formattedAddress} has been delegated successfully`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, account, address])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
