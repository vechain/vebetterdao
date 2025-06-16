import {
  getB3TrBalanceQueryKey,
  buildConvertB3trTx,
  getVot3BalanceQueryKey,
  getVotesQueryKey,
  buildB3trApprovesTx,
  getB3TrTokenDetailsQueryKey,
  buildDelegateVot3Tx,
} from "@/api"
import { useCallback, useMemo } from "react"
import { getConfig } from "@repo/config"
import { removingExcessDecimals } from "@/utils/MathUtils"
import { useWallet, useConnex } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { useVot3RequireSelfDelegation } from "./vechainKitHooks"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
const config = getConfig()

// const buffer = 1.01
// Derived from mainnet onchain txs https://vechain-foundation.slack.com/archives/C06BLEJE5SA/p1723109024015819?thread_ts=1723106964.183119&cid=C06BLEJE5SA
// const suggestedMaxGas = 260118 * buffer

type useMintB3trProps = {
  amount?: string | number
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * Hook to convert B3tr to Vot3
 * This hook will convert the tokens and wait for the txConfirmation
 * @param amount the amount of tokens to convert. Should not already include decimals
 * @param onSuccess callback to run when the upgrade is successful
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useConvertB3tr = ({ amount, onSuccess, transactionModalCustomUI }: useMintB3trProps) => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const requiresSelfDelegation = useVot3RequireSelfDelegation()

  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])

  const clauseBuilder = useCallback(() => {
    if (!contractAmount) throw new Error("amount is required")
    if (!account?.address) throw new Error("account address is required")
    const convertClause = [
      buildB3trApprovesTx(thor, contractAmount, config.vot3ContractAddress),
      buildConvertB3trTx(thor, contractAmount),
    ]

    // If the user requires self delegation, add the delegation clause
    // This is required for privy users, in order to be able to capture the vot3 balance at the snapshot block
    // Check https://github.com/vechain/vechain-kit/issues/102 for more info
    if (requiresSelfDelegation) {
      convertClause.unshift(buildDelegateVot3Tx(thor, account?.address))
    }
    return convertClause
  }, [thor, contractAmount, requiresSelfDelegation, account?.address])

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
    transactionModalCustomUI,
  })
}
