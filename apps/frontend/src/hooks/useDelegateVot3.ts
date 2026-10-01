import { useWallet, useThor } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getCurrentEffectiveVotesPrefixQueryKey } from "../api/contracts/governance/hooks/useGetCurrentEffectiveVotes"
import { getVotesOnBlockPrefixQueryKey } from "../api/contracts/governance/hooks/useVotesOnBlock"
import { getVot3DelegatesQueryKey } from "../api/contracts/vot3/hooks/useVot3Delegates"
import { buildDelegateVot3Tx } from "../api/contracts/vot3/utils/buildDelegateVot3Tx"

import { useBuildTransaction } from "./useBuildTransaction"

type useDelegateVot3Props = {
  onSuccess?: () => void
}
/**
 * Hook to self delegate VOT3 so the user's balance starts being checkpointed as voting power.
 * Recovery path for accounts (mostly smart accounts) that converted B3TR without the delegate clause.
 * @param onSuccess callback to run when the delegation is confirmed
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useDelegateVot3 = ({ onSuccess }: useDelegateVot3Props = {}) => {
  const thor = useThor()
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    if (!account?.address) throw new Error("account address is required")
    return [buildDelegateVot3Tx(thor, account.address)]
  }, [account?.address, thor])

  const refetchQueryKeys = useMemo(
    () => [
      getVot3DelegatesQueryKey(account?.address ?? undefined),
      getVotesOnBlockPrefixQueryKey(),
      getCurrentEffectiveVotesPrefixQueryKey(),
      ["bestBlockCompressed"],
    ],
    [account?.address],
  )

  return useBuildTransaction({ clauseBuilder, refetchQueryKeys, onSuccess })
}
