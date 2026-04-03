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

type ReduceParams = {
  amount: string
}

type UndelegateParams = Record<string, never>

type Props = {
  onSuccess?: () => void
}

export const useReduceDelegation = ({ onSuccess }: Props) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const clauseBuilder = useCallback((params: ReduceParams) => {
    const amountWei = ethers.parseEther(params.amount)

    return [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "reduceDelegation",
        args: [amountWei],
        comment: `Reduce delegation by ${params.amount} VOT3`,
      }),
    ]
  }, [])

  const handleSuccess = useCallback(() => {
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

  return useBuildTransaction<ReduceParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess: handleSuccess,
  })
}

export const useUndelegate = ({ onSuccess }: Props) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const clauseBuilder = useCallback((_params: UndelegateParams) => {
    return [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "undelegate",
        args: [],
        comment: "Fully undelegate from navigator",
      }),
    ]
  }, [])

  const handleSuccess = useCallback(() => {
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

  return useBuildTransaction<UndelegateParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess: handleSuccess,
  })
}
