import { useMemo } from "react"

type ErrorState = {
  error?: any
  title: string
}

export const useTransactionError = (errorStates: ErrorState[]) => {
  return useMemo(() => {
    const activeError = errorStates.find(state => state.error)
    return activeError ? activeError.title : undefined
  }, [errorStates])
}
