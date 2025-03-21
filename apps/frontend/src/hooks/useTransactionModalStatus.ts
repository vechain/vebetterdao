import { useMemo } from "react"
import { TransactionModalStatus } from "@/components"

export type TransactionState = {
  status?: TransactionModalStatus
}

export const useTransactionModalStatus = (states: TransactionState[]) => {
  return useMemo(() => {
    const activeState = states.find(state => state.status)
    return activeState?.status ?? TransactionModalStatus.Unknown
  }, [states])
}
