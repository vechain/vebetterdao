import { getProposalUserDepositQueryKey, useVot3TokenDetails } from "@/api"
import { UseSendTransactionReturnValue } from "./useSendTransaction"
import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getProposalDepositQueryKey } from "@/api/contracts/governance/hooks/useGetProposalDeposit"
import { getIsDepositReachedQueryKey } from "@/api/contracts/governance/hooks/useIsDepositReached"

const config = getConfig()

const GovernorInterface = B3TRGovernor__factory.createInterface()
const GOVERNANCE_CONTRACT = config.b3trGovernorAddress

type UseProposalVot3DepositProps = {
  proposalId: string
  onSuccess?: () => void
}

export const useWithdrawDeposit = ({ proposalId, onSuccess }: UseProposalVot3DepositProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        contractInterface: GovernorInterface,
        to: GOVERNANCE_CONTRACT,
        method: "withdraw",
        args: [proposalId, account],
        comment: `withdraw deposited vot3 of proposal ${proposalId}`,
      }),
    ]
  }, [account, proposalId])

  const refetchQueryKeys = useMemo(
    () => [getProposalUserDepositQueryKey(proposalId, account ?? "")],
    [account, proposalId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
