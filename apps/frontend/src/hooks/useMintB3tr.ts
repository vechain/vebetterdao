import {
    getB3TrTokenDetailsQueryKey,
    getB3TrBalanceQueryKey,
    buildMintB3trTx,
} from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"



type useMintB3trProps = {
    address?: string
    amount?: string
    onSuccess?: () => void
    invalidateCache?: boolean
    onSuccessMessageTitle?: string
}
/**
 * Hook to apply for a token upgrade
 * This hook will send a mint transaction to the blockchain and wait for the txConfirmation
 * @param address the address to mint the tokens to
 * @param amount the amount of tokens to mint
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCahce boolean to indicate if the related react-query cache should be updated (default: true)
 * @param onSuccessMessageTitle the title of the success toast message
 * @returns sendTransaction function to send the tx
 * @returns sendTransactionLoading boolean to indicate if the tx is waiting for confirmation
 * @returns sendTransactionError boolean to indicate if the upgrade has failed
 * @returns isTxReceiptLoading boolean to indicate if the tx receipt is loading
 * @returns isTxReceiptError boolean to indicate if the tx receipt has failed
 * @returns txReceipt the tx receipt
 */
export const useMintB3tr = ({
    address,
    amount,
    onSuccess,
    invalidateCache = true,
    onSuccessMessageTitle = "Upgrade requested successfully.",
}: useMintB3trProps) => {
    const { thor } = useConnex()
    const { account } = useWallet()
    const toast = useToast()
    const queryClient = useQueryClient()

    const buildClauses = useCallback(() => {
        if (!address) throw new Error("address is required")
        if (!amount) throw new Error("amount is required")
        const clauses = buildMintB3trTx(thor, address, amount)
        return [clauses]
    }, [thor, address, amount])

    //Refetch queries to update ui after the tx is confirmed
    const handleOnSuccess = useCallback(async () => {
        if (invalidateCache) {
            await queryClient.refetchQueries({
                queryKey: getB3TrTokenDetailsQueryKey(),
            })
            await queryClient.refetchQueries({
                queryKey: getB3TrBalanceQueryKey(account ?? undefined),
            })
        }

        toast({
            title: onSuccessMessageTitle,
            description: `Tokens minted succesfully.`,
            status: "success",
            position: "bottom-left",
            duration: 5000,
            isClosable: true,
        })
        onSuccess?.()
    }, [
        invalidateCache,
        queryClient,
        toast,
        onSuccess,
        account,
    ])

    const result = useSendTransaction({
        signerAccount: account,
        clauses: buildClauses,
        onTxConfirmed: handleOnSuccess,
    })

    return result
}
