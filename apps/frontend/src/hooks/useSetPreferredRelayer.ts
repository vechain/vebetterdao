import { getConfig } from "@repo/config"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { relayerRewardsPoolAbi } from "@/api/contracts/relayerRewardsPool/abi"
import { getPreferredRelayerQueryKey } from "@/api/contracts/relayerRewardsPool/hooks/usePreferredRelayer"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { useBuildTransaction } from "./useBuildTransaction"

const address = getConfig().relayerRewardsPoolContractAddress
const abi = relayerRewardsPoolAbi

type ClausesProps = {
  relayerAddress: string
}

type UseSetPreferredRelayerProps = {
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

export const useSetPreferredRelayer = ({ onSuccess, transactionModalCustomUI }: UseSetPreferredRelayerProps = {}) => {
  const { account } = useWallet()
  const thor = useThor()

  const contract = thor.contracts.load(address, abi)

  const clauseBuilder = ({ relayerAddress }: ClausesProps) => [
    contract.clause.setPreferredRelayer(relayerAddress, {
      comment: "Set preferred relayer",
    }).clause,
  ]

  const refetchQueryKeys = useMemo(() => [getPreferredRelayerQueryKey(account?.address ?? "")], [account?.address])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
