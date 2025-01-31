import {
  getB3TrBalanceQueryKey,
  buildConvertB3trTx,
  getVot3BalanceQueryKey,
  getVotesQueryKey,
  buildB3trApprovesTx,
  getB3TrTokenDetailsQueryKey,
} from "@/api"
import { useCallback, useMemo } from "react"
import { getConfig } from "@repo/config"
import { removingExcessDecimals } from "@/utils/MathUtils"
import { useWallet, useConnex } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"

const config = getConfig()

// const buffer = 1.01
// Derived from mainnet onchain txs https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1723109024015819?thread_ts=1723106964.183119&cid=C06BLEJE5SA
// const suggestedMaxGas = 260118 * buffer

type useMintB3trProps = {
  amount?: string | number
  onSuccess?: () => void
}

/**
 * Hook to convert B3tr to Vot3
 * This hook will convert the tokens and wait for the txConfirmation
 * @param amount the amount of tokens to convert. Should not already include decimals
 * @param onSuccess callback to run when the upgrade is successful
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useConvertB3tr = ({ amount, onSuccess }: useMintB3trProps) => {
  const { thor } = useConnex()
  const { account } = useWallet()

  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])

  const clauseBuilder = useCallback(() => {
    if (!contractAmount) throw new Error("amount is required")
    return [
      buildB3trApprovesTx(thor, contractAmount, config.vot3ContractAddress),
      buildConvertB3trTx(thor, contractAmount),
    ]
  }, [thor, contractAmount])

  const refetchQueryKeys = useMemo(
    () => [
      getB3TrBalanceQueryKey(account?.address ?? undefined),
      getVot3BalanceQueryKey(account?.address ?? ""),
      getVotesQueryKey(account?.address ?? undefined),
      getB3TrBalanceQueryKey(config.vot3ContractAddress),
      getB3TrTokenDetailsQueryKey(),
    ],
    [account?.address],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
