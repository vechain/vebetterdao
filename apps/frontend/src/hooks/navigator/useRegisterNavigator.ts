import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { B3TR__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { EnhancedClause, useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { buildClause } from "@/utils/buildClause"

import { getIsNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { useBuildTransaction } from "../useBuildTransaction"
import { getB3trBalanceQueryKey } from "../useGetB3trBalance"

const B3trInterface = B3TR__factory.createInterface()
const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

type RegisterParams = {
  stakeAmount: string
  metadataURI: string
}

type Props = {
  onSuccess?: () => void
}

export const useRegisterNavigator = ({ onSuccess }: Props) => {
  const { account } = useWallet()
  const { data: isDelegated } = useIsDelegated(account?.address)

  const clauseBuilder = useCallback(
    (params: RegisterParams) => {
      const amountWei = ethers.parseEther(params.stakeAmount)

      const clauses: EnhancedClause[] = []

      if (isDelegated) {
        clauses.push(
          buildClause({
            to: navigatorRegistryAddress,
            contractInterface: NavigatorRegistryInterface,
            method: "undelegate",
            args: [],
            comment: "Exit current delegation before registering as navigator",
          }),
        )
      }

      clauses.push(
        buildClause({
          to: getConfig().b3trContractAddress,
          contractInterface: B3trInterface,
          method: "approve",
          args: [navigatorRegistryAddress, amountWei],
          comment: `Approve ${params.stakeAmount} B3TR to NavigatorRegistry`,
        }),
        buildClause({
          to: navigatorRegistryAddress,
          contractInterface: NavigatorRegistryInterface,
          method: "register",
          args: [amountWei, params.metadataURI],
          comment: `Register as navigator with ${params.stakeAmount} B3TR stake`,
        }),
      )

      return clauses
    },
    [isDelegated],
  )

  const refetchQueryKeys = useMemo(
    () => [getIsNavigatorQueryKey(account?.address ?? ""), getB3trBalanceQueryKey(account?.address ?? "")],
    [account],
  )

  return useBuildTransaction<RegisterParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
