import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { B3TR__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { EnhancedClause, useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useIsAutoVotingEnabled } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { buildClause } from "@/utils/buildClause"

import { getIsNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { getIsAutoVotingEnabledQueryKey } from "../../api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useBuildTransaction } from "../useBuildTransaction"
import { getB3trBalanceQueryKey } from "../useGetB3trBalance"

const B3trInterface = B3TR__factory.createInterface()
const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress

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
  const { data: isAutoVotingEnabled } = useIsAutoVotingEnabled()

  const clauseBuilder = useCallback(
    (params: RegisterParams) => {
      const amountWei = ethers.parseEther(params.stakeAmount)

      const clauses: EnhancedClause[] = []

      if (isAutoVotingEnabled) {
        clauses.push(
          buildClause({
            to: xAllocationVotingAddress,
            contractInterface: XAllocationVotingInterface,
            method: "toggleAutoVoting",
            args: [account?.address],
            comment: "Disable auto-voting before registering as navigator",
          }),
        )
      }

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
    [isDelegated, isAutoVotingEnabled, account?.address],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getIsNavigatorQueryKey(account?.address ?? ""),
      getB3trBalanceQueryKey(account?.address ?? ""),
      getIsAutoVotingEnabledQueryKey(account?.address ?? ""),
    ],
    [account],
  )

  return useBuildTransaction<RegisterParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
