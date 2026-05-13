import { useVechainDomain } from "@vechain/dapp-kit-react"

import { useGetDelegatee } from "../api/contracts/vePassport/hooks/useGetDelegatee"

type Props = {
  isVeDelegated: boolean
  isLoading: boolean
  isError: boolean
}

export const useIsVeDelegated = (account: string): Props => {
  const { data: delegateeAddress, isLoading: isDelegateeLoading, isError: isDelegateeError } = useGetDelegatee(account)
  const { domain, isLoading: isDomainLoading } = useVechainDomain({ addressOrDomain: delegateeAddress })

  // Treat as loading until both (a) who (if anyone) the user delegated their passport to and
  // (b) whether that delegatee resolves to a *.wallet.vedelegate.vet domain are known. If we
  // collapsed loading to isVeDelegated=false, the navigator delegation hooks would skip the
  // revokeDelegation() clause and reintroduce the very bug we're guarding against.
  // No need to wait for the domain lookup when there is no delegatee — we already know.
  const isLoading = isDelegateeLoading || (!!delegateeAddress && isDomainLoading)

  return {
    isVeDelegated: !isLoading && !isDelegateeError && (domain?.endsWith("wallet.vedelegate.vet") ?? false),
    isLoading,
    isError: isDelegateeError,
  }
}
