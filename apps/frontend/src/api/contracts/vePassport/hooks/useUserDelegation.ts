import { useWallet } from "@vechain/vechain-kit"

import { useGetDelegatee } from "./useGetDelegatee"
import { useGetDelegator } from "./useGetDelegator"

/**
 * Hook to get the user's delegation information.
 * @returns An object containing the user's delegator and delegatee addresses, and loading states.
 */
export const useUserDelegation = () => {
  const { account } = useWallet()
  const { data: delegator, isLoading: isDelegatorLoading } = useGetDelegator(account?.address)
  const { data: delegatee, isLoading: isDelegateeLoading } = useGetDelegatee(account?.address)
  return {
    delegator,
    delegatee,
    isLoading: isDelegatorLoading || isDelegateeLoading,
    isDelegator: !!delegatee,
    isDelegatee: !!delegator,
  }
}
