import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"

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

const useInvalidateNavigatorQueries = () => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  return useCallback(() => {
    const addr = account?.address ?? ""
    queryClient.invalidateQueries({ queryKey: getIsDelegatedQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetDelegatedAmountQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getIsNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getVot3BalanceQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: ["indexer", "navigators"] })
  }, [queryClient, account])
}

export const useReduceDelegation = ({ onSuccess }: Props) => {
  const invalidateAll = useInvalidateNavigatorQueries()

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
    invalidateAll()
    onSuccess?.()
  }, [invalidateAll, onSuccess])

  return useBuildTransaction<ReduceParams>({
    clauseBuilder,
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}

export const useUndelegate = ({ onSuccess }: Props) => {
  const invalidateAll = useInvalidateNavigatorQueries()

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
    invalidateAll()
    onSuccess?.()
  }, [invalidateAll, onSuccess])

  return useBuildTransaction<UndelegateParams>({
    clauseBuilder,
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}
