import { useVechainDomain } from "@vechain/dapp-kit-react"

import { useGetDelegatee } from "../api/contracts/vePassport/hooks/useGetDelegatee"

type Props = {
  isVeDelegated: boolean
}
export const useIsVeDelegated = (account: string): Props => {
  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(account)
  const { domain } = useVechainDomain({ addressOrDomain: delegateeAddress })
  if (isDelegateeLoading) return { isVeDelegated: false }
  return {
    isVeDelegated: domain?.endsWith("wallet.vedelegate.vet") ?? false,
  }
}
