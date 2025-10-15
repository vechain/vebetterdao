import { getConfig } from "@repo/config"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { getB3TrTokenDetailsQueryKey } from "../api/contracts/b3tr/hooks/useB3trTokenDetails"
import { buildConvertVot3Tx } from "../api/contracts/vot3/utils/buildConvertVot3Tx"
import { removingExcessDecimals } from "../utils/MathUtils/MathUtils"

import { useBuildTransaction } from "./useBuildTransaction"
import { getB3trBalanceQueryKey } from "./useGetB3trBalance"
import { getVot3BalanceQueryKey } from "./useGetVot3Balance"

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
 * Hook to convert VOT3 tokens to B3TR tokens
 * This hook will convert the tokens and wait for the txConfirmation
 * @param amount the amount of tokens to convert. Should not already include decimals
 * @param onSuccess callback to run when the upgrade is successful
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useConvertVot3 = ({ amount, onSuccess, transactionModalCustomUI }: useMintB3trProps) => {
  const thor = useThor()
  const { account } = useWallet()
  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])
  const clauseBuilder = useCallback(() => {
    if (!contractAmount) throw new Error("amount is required")
    return [buildConvertVot3Tx(thor, contractAmount)]
  }, [thor, contractAmount])
  const refetchQueryKeys = useMemo(
    () => [
      getB3trBalanceQueryKey(account?.address ?? undefined),
      getVot3BalanceQueryKey(account?.address ?? ""),
      // TODO: migration check if this is needed cause hook not used anywhere
      //  getVotesQueryKey(account?.address ?? undefined),
      getB3trBalanceQueryKey(config.vot3ContractAddress),
      getB3TrTokenDetailsQueryKey(),
    ],
    [account?.address],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
    gasPadding: GAS_PADDING,
  })
}
