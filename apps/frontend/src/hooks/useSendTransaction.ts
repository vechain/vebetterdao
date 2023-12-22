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
    signerAccount?: string | null
    clauses:
    | EnhancedClause[]
    | (() => EnhancedClause[])
    | (() => Promise<EnhancedClause[]>)
    onTxConfirmed?: () => void | Promise<void>
}

/**
 * Generic hook to send a transaction and wait for the txReceipt
 * @param signerAccount the signer account to use
 * @param clauses clauses to send in the transaction
 * @param onTxConfirmed callback to run when the tx is confirmed
 */
export const useSendTransaction = ({
    signerAccount,
    clauses,
    onTxConfirmed,
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
        return await convertClauses(clauses).then(clauses => {
            if (signerAccount) return vendor.sign("tx", clauses).signer(signerAccount).request()
            return vendor.sign("tx", clauses).request()
        },
        )
    }

    const {
        mutate: runSendTransaction,
        data: sendTransactionTx,
        isPending: sendTransactionPending,
        error: sendTransactionError,
    } = useMutation({
        mutationFn: sendTransaction,
        onError: (error) => {
            toast({
                title: "Error while signing the transaction.",
                description: `${error.message}`,
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
        if (txReceipt.reverted) {
            toast({
                title: "Transaction reverted.",
                status: "error",
                position: "bottom-left",
                duration: 5000,
                isClosable: true,
            })
            return
        }
        onTxConfirmed?.()
    }, [onTxConfirmed, txReceipt])

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
