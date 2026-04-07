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
    const addr = account?.address ?? ""
    // Background-refetch all relevant queries without clearing existing data
    queryClient.invalidateQueries({ queryKey: getIsDelegatedQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetDelegatedAmountQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getIsNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getVot3BalanceQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: ["indexer", "navigators"] })
    onSuccess?.()
  }, [queryClient, account, onSuccess])

  return useBuildTransaction<DelegateParams>({
    clauseBuilder,
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}
