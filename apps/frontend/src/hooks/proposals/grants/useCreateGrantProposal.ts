import { useCallback, useMemo } from "react"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { B3TRGovernor__factory, Treasury__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { getProposalsEventsQueryKey, getProposalClaimableUserDepositsQueryKey } from "@/api"
import { useBuildTransaction } from "@/hooks"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"
import { type GrantFormData } from "./types"

const governorContractAddress = getConfig().b3trGovernorAddress
const b3trGovernorInterface = B3TRGovernor__factory.createInterface()

const treasuryAddress = getConfig().treasuryContractAddress
const treasuryInterface = Treasury__factory.createInterface()
const grantsManagerAddress = getConfig().grantsManagerContractAddress

type BuildClausesProps = {
  metadataIpfsCID: string
  milestonesIpfsCID: string
  milestones: GrantFormData["milestones"]
  votingRoundId: number
  depositAmount: string
}
/**
 * Data required to create a proposal. Multiple actions could be provided in case we want multiple function to be executed
 */
export type useCreateGrantProposalProps = {
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
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

  const buildClauses = useCallback(
    ({ metadataIpfsCID, milestones, depositAmount, votingRoundId, milestonesIpfsCID }: BuildClausesProps) => {
      const clauses: EnhancedClause[] = []

      const calldatas = milestones.map((milestone: GrantFormData["milestones"][0]) =>
        treasuryInterface.encodeFunctionData("transferB3TR", [
          grantsManagerAddress,
          ethers.parseEther(milestone.fundingAmount.toString()),
        ]),
      )
      const args = [
        Array(milestones.length).fill(treasuryAddress),
        Array(milestones.length).fill(0),
        calldatas,
        metadataIpfsCID,
        votingRoundId,
        ethers.parseEther(depositAmount).toString(),
        account?.address, //TODO: change to grantsReceiver
        milestonesIpfsCID,
      ]
      const createProposalClause = buildClause({
        contractInterface: b3trGovernorInterface,
        to: governorContractAddress,
        method: "proposeGrant",
        args,
        comment: `Create new proposal for round ${votingRoundId} with metadata: ${metadataIpfsCID} and milestones: ${milestonesIpfsCID}`,
      })

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
    gasPadding: 0.15,
  })
}
