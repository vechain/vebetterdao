import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getGetDelegatedAmountQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { getGetNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { getIsDelegatedQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { getIsNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { useBuildTransaction } from "../useBuildTransaction"
import { getVot3BalanceQueryKey } from "../useGetVot3Balance"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

type DelegateParams = {
  navigatorAddress: string
  amount: string
}

type Props = {
  onSuccess?: () => void
}

export const useDelegateToNavigator = ({ onSuccess }: Props) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const clauseBuilder = useCallback((params: DelegateParams) => {
    const amountWei = ethers.parseEther(params.amount)

    return [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "delegate",
        args: [params.navigatorAddress, amountWei],
        comment: `Delegate ${params.amount} VOT3 to navigator`,
      }),
    ]
  }, [])

  const handleSuccess = useCallback(() => {
    // Invalidate all indexer navigator queries so they refetch
    queryClient.invalidateQueries({ queryKey: ["indexer", "navigators"] })
    onSuccess?.()
  }, [queryClient, onSuccess])

  const refetchQueryKeys = useMemo(
    () => [
      getIsDelegatedQueryKey(account?.address ?? ""),
      getGetDelegatedAmountQueryKey(account?.address ?? ""),
      getGetNavigatorQueryKey(account?.address ?? ""),
      getIsNavigatorQueryKey(account?.address ?? ""),
      getVot3BalanceQueryKey(account?.address ?? ""),
    ],
    [account],
  )

  return useBuildTransaction<DelegateParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess: handleSuccess,
  })
}
