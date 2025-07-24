import { useCallback, useMemo } from "react"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { governanceAvailableContracts } from "@/constants"
import { ethers } from "ethers"
import { B3TRGovernor__factory, VOT3__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { isZero } from "@repo/utils/FormattingUtils"
import { getProposalsEventsQueryKey, getProposalClaimableUserDepositsQueryKey } from "@/api"
import { useBuildTransaction } from "@/hooks"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

export type AvailableContractAbis = (typeof governanceAvailableContracts)[number]["abi"]["abi"][number]

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress
const b3trGovernorInterface = B3TRGovernor__factory.createInterface()

const vot3Interface = VOT3__factory.createInterface()

/**
 * Represent a single action to be exeuted in case the proposal is successful
 * This is equal to a smart contract call to the given function with the given params
 */
export type ProposalAction = {
  contractAddress: string
  calldata: string
}
/**
 * Data required to create a proposal. Multiple actions could be provided in case we want multiple function to be executed
 */
export type useCreateStandardProposalProps = {
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

export type ReducedActions = {
  contractsAddress: string[]
  calldatas: string[]
}

type BuildClausesProps = {
  description: string
  actions: ProposalAction[]
  startRoundId: number | string
  depositAmount: string
}
/**
 * Hook to create a proposal with the given calldata or actions. I.e functions to call if the proposal is executed
 * @param description The description of the proposal
 * @param actions the functions we want to execute in case the proposal is successful
 * @param transactionModalCustomUI custom UI for the transaction modal
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useCreateStandardProposal = ({ onSuccess, transactionModalCustomUI }: useCreateStandardProposalProps) => {
  const { account } = useWallet()

  const buildClauses = useCallback(
    ({ description, actions, startRoundId, depositAmount }: BuildClausesProps) => {
      if (!description) throw new Error("description is required")
      if (!actions) throw new Error("actions is required")
      if (!startRoundId) throw new Error("startRoundId is required")
      if (!depositAmount) throw new Error("depositAmount is required")
      if (!account?.address) throw new Error("Account is required")

      const clauses: EnhancedClause[] = []
      const parsedDepositAmount = ethers.parseEther(depositAmount).toString()

      if (!isZero(depositAmount)) {
        const approveClause: EnhancedClause = {
          to: getConfig().vot3ContractAddress,
          value: 0,
          data: vot3Interface.encodeFunctionData("approve", [GOVERNANCE_CONTRACT, parsedDepositAmount]),
          comment: `Approve ${GOVERNANCE_CONTRACT} to transfer ${depositAmount} VOT3`,
          abi: JSON.parse(JSON.stringify(vot3Interface.getFunction("approve"))),
        }
        clauses.push(approveClause)
      }

      const targetsAndCalldata = actions.reduce<ReducedActions>(
        (acc, action) => {
          acc.contractsAddress.push(action.contractAddress)
          acc.calldatas.push(action.calldata)
          return acc
        },
        { contractsAddress: [], calldatas: [] },
      )

      const createProposalClause: EnhancedClause = {
        to: GOVERNANCE_CONTRACT,
        value: 0,
        data: b3trGovernorInterface.encodeFunctionData("propose", [
          targetsAndCalldata.contractsAddress,
          Array(actions.length).fill(0),
          targetsAndCalldata.calldatas,
          description,
          startRoundId,
          parsedDepositAmount,
        ]),
        comment: `Create new proposal for round ${startRoundId} with description: ${description}`,
        abi: JSON.parse(JSON.stringify(b3trGovernorInterface.getFunction("propose"))),
      }
      clauses.push(createProposalClause)

      return clauses
    },
    [account?.address],
  )

  const refetchQueryKeys = useMemo(() => {
    return [getProposalsEventsQueryKey(), getProposalClaimableUserDepositsQueryKey(account?.address ?? "")]
  }, [account?.address])
  return useBuildTransaction({
    clauseBuilder: buildClauses,
    onSuccess,
    refetchQueryKeys,
    transactionModalCustomUI,
  })
}
