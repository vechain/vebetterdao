import { useMemo } from "react"
import { TransactionStatus } from "@vechain/vechain-kit"

export type TransactionState = {
  status?: TransactionStatus | "uploadingMetadata"
}

export const useTransactionModalStatus = (states: TransactionState[]) => {
  return useMemo(() => {
    const activeState = states.find(state => state.status)
    return activeState?.status ?? "unknown"
  }, [states])
}
