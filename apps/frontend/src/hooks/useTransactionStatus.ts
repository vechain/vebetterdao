import { useMemo } from "react"
import { TransactionStatus } from "@/hooks"

export type TransactionState = {
  status?: TransactionStatus | "uploadingMetadata"
}

export const useTransactionStatus = (states: TransactionState[]) => {
  return useMemo(() => {
    const activeState = states.find(state => state.status)
    return activeState?.status ?? "unknown"
  }, [states])
}
