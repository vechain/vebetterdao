import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { pollForReceipt } from "../pollForReceipt"

export const txReceiptQueryKey = (txId?: string) => ["TX_RECEIPT", txId]

/**
 *  Get the tx receipt of a tx id with a block timeout to wait for the receipt
 * @param txId  the tx id to get the receipt
 * @param blocksTimeout  the blocks to wait for the receipt
 * @returns  the tx receipt
 */
export const useTxReceipt = (txId?: string, blocksTimeout?: number) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: txReceiptQueryKey(txId),
    queryFn: () => pollForReceipt(thor, txId, blocksTimeout),
    enabled: !!txId,
    staleTime: Infinity,
  })
}
