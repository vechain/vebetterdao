import { getConfig } from "@repo/config"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { getB3TrTokenDetailsQueryKey } from "../api/contracts/b3tr/hooks/useB3trTokenDetails"
import { buildB3trApprovesTx } from "../api/contracts/b3tr/utils/buildB3trApprovesTx"
import { buildConvertB3trTx } from "../api/contracts/vot3/utils/buildConvertB3trTx"
import { buildDelegateVot3Tx } from "../api/contracts/vot3/utils/buildDelegateVot3Tx"
import { removingExcessDecimals } from "../utils/MathUtils/MathUtils"

import { useBuildTransaction } from "./useBuildTransaction"
import { getB3trBalanceQueryKey } from "./useGetB3trBalance"
import { getVot3BalanceQueryKey } from "./useGetVot3Balance"
import { useVot3RequireSelfDelegation } from "./vechainKitHooks/useVot3RequireSelfDelegation"

const config = getConfig()
// Extra 5% to mitigate sporadic wrong estimation of gas
// Check https://vechain-foundation.slack.com/archives/C060FHDHG2J/p1753095056679039?thread_ts=1753093780.802499&cid=C060FHDHG2J
const GAS_PADDING = 0.05
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
  const thor = useThor()
  const { account } = useWallet()
  const requiresSelfDelegation = useVot3RequireSelfDelegation()
  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])

  const convertClause = useMemo(
    () => [
      buildB3trApprovesTx(thor, contractAmount, config.vot3ContractAddress),
      buildConvertB3trTx(thor, contractAmount),
    ],
    [contractAmount, thor],
  )

  const clauseBuilder = useCallback(() => {
    if (!contractAmount) throw new Error("amount is required")
    if (!account?.address) throw new Error("account address is required")

    // If the user requires self delegation, add the delegation clause
    // This is required for privy users, in order to be able to capture the vot3 balance at the snapshot block
    // Check https://github.com/vechain/vechain-kit/issues/102 for more info
    if (requiresSelfDelegation) {
      convertClause.unshift(buildDelegateVot3Tx(thor, account?.address))
    }
    return convertClause
  }, [contractAmount, account?.address, requiresSelfDelegation, convertClause, thor])

  const refetchQueryKeys = useMemo(
    () => [
      getB3trBalanceQueryKey(account?.address ?? undefined),
      getVot3BalanceQueryKey(account?.address ?? ""),
      // TODO: migration check if this is needed cause hook not used anywhere
      // getVotesQueryKey(account?.address ?? undefined),
      getB3trBalanceQueryKey(config.vot3ContractAddress),
      getB3TrTokenDetailsQueryKey(),
    ],
    [account?.address],
  )

  return {
    clauses: convertClause,
    ...useBuildTransaction({
      clauseBuilder,
      refetchQueryKeys,
      onSuccess,
      transactionModalCustomUI,
      gasPadding: GAS_PADDING,
    }),
  }
}
