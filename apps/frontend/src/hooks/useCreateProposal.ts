import { getProposalEvents } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { governanceAvailableContracts } from "@/constants"
import { ethers } from "ethers"
import { B3TRGovernor__factory, VOT3__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { evalManifestWithRetries } from "next/dist/server/load-components"
import { isZero } from "@repo/utils/FormattingUtils"
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
export type useCreateProposalProps = {
  invalidateCache?: boolean
  onSuccess?: () => void
}

type BuildClausesProps = {
  description: string
  actions: ProposalAction[]
  startRoundId: number | string
  depositAmount: string
}

type useCreateProposalReturnValue = {
  sendTransaction: (props: BuildClausesProps) => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * Hook to create a proposal with the given calldata or actions. I.e functions to call if the proposal is executed
 * @param description The description of the proposal
 * @param actions the functions we want to execute in case the proposal is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useCreateProposal = ({
  invalidateCache = true,
  onSuccess,
}: useCreateProposalProps): useCreateProposalReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getProposalEvents(),
      })
      await queryClient.refetchQueries({
        queryKey: getProposalEvents(),
      })
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, onSuccess])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  const buildClauses = useCallback(
    ({ description, actions, startRoundId, depositAmount }: BuildClausesProps) => {
      if (!account) throw new Error("Account is required")
      type ReducedActions = {
        contractsAddress: string[]
        calldatas: string[]
      }
      const clauses: EnhancedClause[] = []
      const parsedDepositAmount = ethers.parseEther(depositAmount).toString()

      console.log("depositAmount", depositAmount)
      console.log("parsedDepositAmount", parsedDepositAmount)
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
    [account],
  )

  const onMutate = useCallback(
    async (data: BuildClausesProps) => {
      if (!data.description) throw new Error("description is required")
      if (!data.actions) throw new Error("actions is required")
      if (!data.startRoundId) throw new Error("startRoundId is required")
      if (!data.depositAmount) throw new Error("depositAmount is required")

      const clauses = buildClauses(data)
      return result.sendTransaction(clauses)
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction: onMutate }
}
