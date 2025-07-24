import { useCallback, useMemo } from "react"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { governanceAvailableContracts } from "@/constants"
import { ethers } from "ethers"
import { B3TRGovernor__factory, Treasury__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { getProposalsEventsQueryKey, getProposalClaimableUserDepositsQueryKey } from "@/api"
import { useBuildTransaction } from "@/hooks"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

export type AvailableContractAbis = (typeof governanceAvailableContracts)[number]["abi"]["abi"][number]

const governorContractAddress = getConfig().b3trGovernorAddress
const b3trGovernorInterface = B3TRGovernor__factory.createInterface()

const treasuryAddress = getConfig().treasuryContractAddress
const treasuryInterface = Treasury__factory.createInterface()
const grantsManagerAddress = getConfig().grantsManagerContractAddress
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
export type useCreateGrantProposalProps = {
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

export type ReducedActions = {
  contractsAddress: string[]
  calldatas: string[]
}

/**
 * Hook to create a proposal with the given calldata or actions. I.e functions to call if the proposal is executed
 * @param description The description of the proposal
 * @param actions the functions we want to execute in case the proposal is successful
 * @param transactionModalCustomUI custom UI for the transaction modal
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useCreateGrantProposal = ({ onSuccess, transactionModalCustomUI }: useCreateGrantProposalProps) => {
  const { account } = useWallet()

  const buildClauses = useCallback(() => {
    const clauses: EnhancedClause[] = []

    const calldatas = [
      treasuryInterface.encodeFunctionData("transferB3TR", [grantsManagerAddress, ethers.parseEther("1")]),
    ]

    const argszada = [
      [treasuryAddress],
      [0], //TODO: REMOVE MOCK VALUE
      calldatas,
      "aosndiuasniujda",
      7,
      0,
      "aksbdaijsd",
    ]
    console.log("argszada", argszada)
    const createProposalClause = buildClause({
      contractInterface: b3trGovernorInterface,
      to: governorContractAddress,
      method: "proposeGrant",
      args: argszada,
    })
    console.log("createProposalClause", createProposalClause)

    clauses.push(createProposalClause)

    return clauses
  }, [])

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
