import { useWallet } from "@vechain/dapp-kit-react"
import { useGetDelegator } from "./useGetDelegator"
import { useGetDelegatee } from "./useGetDelegatee"

/**
 * Hook to get the user's delegation information.
 * @returns An object containing the user's delegator and delegatee addresses, and loading states.
 */
export const useUserDelegation = () => {
  const { account } = useWallet()
  const { data: delegator, isLoading: isDelegatorLoading } = useGetDelegator(account)
  const { data: delegatee, isLoading: isDelegateeLoading } = useGetDelegatee(account)

  return {
    delegator,
    delegatee,
    isLoading: isDelegatorLoading || isDelegateeLoading,
    isDelegator: !!delegatee && Number(delegatee) > 0,
    isDelegatee: !!delegator && Number(delegator) > 0,
  }
}
