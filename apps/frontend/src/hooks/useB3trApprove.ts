import { useWallet, useThor } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getB3TrAllowanceQueryKey } from "@/api/contracts/b3tr/hooks/useB3trAllowance"

import { buildB3trApprovesTx } from "../api/contracts/b3tr/utils/buildB3trApprovesTx"

import { useBuildTransaction } from "./useBuildTransaction"

type useB3trApproveProps = {
  spender: string
  amount?: string | number
  onSuccess?: () => void
}
export const useB3trApprove = ({ spender, amount, onSuccess }: useB3trApproveProps) => {
  const thor = useThor()
  const { account } = useWallet()
  const clauseBuilder = useCallback(() => {
    if (amount === undefined) throw new Error("amount is required")
    return [buildB3trApprovesTx(thor, amount, spender)]
  }, [thor, amount, spender])
  const refetchQueryKeys = useMemo(
    () => [getB3TrAllowanceQueryKey(account?.address ?? undefined, spender)],
    [account?.address, spender],
  )
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
