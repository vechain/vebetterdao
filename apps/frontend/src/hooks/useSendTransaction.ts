import { useGetTxReceipt } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useEffect } from "react"

type EnhancedClause = Connex.VM.Clause & {
    comment?: string
    abi?: object
}
type UseSendTransactionProps = {
    clauses:
    | EnhancedClause[]
    | (() => EnhancedClause[])
    | (() => Promise<EnhancedClause[]>)
    onSuccess?: () => void | Promise<void>
}

/**
 * Generic hook to send a transaction and wait for the txReceipt
 * @param clauses clauses to send in the transaction
 * @param onSuccess callback to run when the upgrade is successful
 */
export const useSendTransaction = ({
    clauses,
    onSuccess,
}: UseSendTransactionProps) => {
    const toast = useToast()
    const { vendor } = useConnex()

    async function convertClauses(
        clauses:
            | EnhancedClause[]
            | (() => EnhancedClause[])
            | (() => Promise<EnhancedClause[]>),
    ) {
        if (typeof clauses === "function") {
            return clauses()
        }
        return clauses
    }

    const sendTransaction = async () => {
        return await convertClauses(clauses).then(clauses =>
            vendor.sign("tx", clauses).request(),
        )
    }

    const {
        mutate: runSendTransaction,
        data: sendTransactionTx,
        isPending: sendTransactionPending,
        isError: sendTransactionError,
    } = useMutation({
        mutationFn: sendTransaction,
        onError: () => {
            toast({
                title: "Error while signing the transaction.",
                description: `Have you rejected it? Please try again.`,
                status: "error",
                position: "bottom-left",
                duration: 5000,
                isClosable: true,
            })
        }
    })

    const {
        data: txReceipt,
        isFetching: isTxReceiptLoading,
        isError: isTxReceiptError,
    } = useGetTxReceipt(sendTransactionTx?.txid)

    useEffect(() => {
        if (!txReceipt) return
        onSuccess?.()
    }, [onSuccess, txReceipt])

    /**
     * TODO: In case of errors, call the callback
     */

    return {
        sendTransaction: runSendTransaction,
        sendTransactionPending,
        sendTransactionError,
        isTxReceiptLoading,
        isTxReceiptError,
        txReceipt,
    }
}
