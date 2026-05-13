import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"

import { getDelegateeQueryKey, useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { invalidateNavigatorQueries } from "@/api/indexer/navigators/useNavigators"
import { buildClause } from "@/utils/buildClause"

import { getVotesOnBlockPrefixQueryKey } from "../../api/contracts/governance/hooks/useVotesOnBlock"
import { getGetDelegatedAmountQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { getGetNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { getIsDelegatedQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { getIsNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { useBuildTransaction } from "../useBuildTransaction"
import { getVot3BalanceQueryKey } from "../useGetVot3Balance"
import { getVot3UnlockedBalanceQueryKey } from "../useGetVot3UnlockedBalance"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const PassportContractInterface = VeBetterPassport__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress
const passportContractAddress = getConfig().veBetterPassportContractAddress

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
  // Passport delegation routes voting qualification away from the delegator; without revoking,
  // the navigator delegation has no effect because the delegatee keeps voting on the user's behalf.
  const { data: delegateeAddress } = useGetDelegatee(account?.address)

  const clauseBuilder = useCallback(
    (params: DelegateParams) => {
      const amountWei = ethers.parseEther(params.amount)

      const delegateClause = buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "delegate",
        args: [params.navigatorAddress, amountWei],
        comment: `Delegate ${params.amount} VOT3 to navigator`,
      })

      if (!delegateeAddress) return [delegateClause]

      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method: "revokeDelegation",
          args: [],
          comment: "Revoke passport delegation",
        }),
        delegateClause,
      ]
    },
    [delegateeAddress],
  )

  const handleSuccess = useCallback(() => {
    const addr = account?.address ?? ""
    // Background-refetch all relevant queries without clearing existing data
    queryClient.invalidateQueries({ queryKey: getIsDelegatedQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetDelegatedAmountQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getIsNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getVot3BalanceQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getVot3UnlockedBalanceQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getDelegateeQueryKey(addr) })
    invalidateNavigatorQueries(queryClient)
    queryClient.invalidateQueries({ queryKey: ["get", "/api/v1/b3tr/navigators/citizens"] })
    queryClient.invalidateQueries({ queryKey: ["get", "/api/v1/b3tr/navigators/delegations"] })
    queryClient.invalidateQueries({ queryKey: getVotesOnBlockPrefixQueryKey() })
    queryClient.invalidateQueries({ queryKey: ["bestBlockCompressed"] })
    onSuccess?.()
  }, [queryClient, account, onSuccess])

  return useBuildTransaction<DelegateParams>({
    clauseBuilder,
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}
