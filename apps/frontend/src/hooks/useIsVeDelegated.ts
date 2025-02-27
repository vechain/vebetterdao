import { useVechainDomain } from "@vechain/dapp-kit-react"
import { useGetDelegatee } from "@/api"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

type Props = {
  isVeDelegated: boolean
  isLoading: boolean
}

export const useIsVeDelegated = (account: string): Props => {
  const queryClient = useQueryClient()
  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(account)
  const { domain } = useVechainDomain({ addressOrDomain: delegateeAddress })

  const getIsVeDelegatedQueryKey = (domain?: string) => ["isVeDelegated", domain]

  const checkIsVeDelegated = useMemo(() => domain?.endsWith("wallet.vedelegate.vet") ?? false, [domain])

  const { data: isVeDelegated = false, isLoading } = useQuery({
    queryKey: getIsVeDelegatedQueryKey(domain),
    queryFn: async () => {
      return queryClient.ensureQueryData({
        queryKey: getIsVeDelegatedQueryKey(domain),
        queryFn: () => checkIsVeDelegated,
      })
    },
    enabled: !isDelegateeLoading && !!delegateeAddress,
  })

  return {
    isVeDelegated,
    isLoading: isLoading || isDelegateeLoading,
  }
}
