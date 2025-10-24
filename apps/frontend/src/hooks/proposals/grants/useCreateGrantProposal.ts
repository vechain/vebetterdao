import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { Treasury__factory } from "@vechain/vebetterdao-contracts/factories/Treasury__factory"
import { EnhancedClause, useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"

import { getAllProposalsStateQueryKey } from "../../../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalClaimableUserDepositsQueryKey } from "../../../api/contracts/governance/hooks/useProposalClaimableUserDeposits"
import { getProposalsEventsQueryKey } from "../../../api/contracts/governance/hooks/useProposalsEvents"
import { useBuildTransaction } from "../../useBuildTransaction"
import { getEventsKey } from "../../useEvents"
import { getAllProposalsMetadataQueryKey } from "../grants/useStandardOrGrantProposalDetails"

import { GrantFormData } from "./types"

const governorContractAddress = getConfig().b3trGovernorAddress
const b3trGovernorInterface = B3TRGovernor__factory.createInterface()
const treasuryAddress = getConfig().treasuryContractAddress
const treasuryInterface = Treasury__factory.createInterface()
const grantsManagerAddress = getConfig().grantsManagerContractAddress
type BuildClausesProps = {
  metadataIpfsCID: string
  milestonesIpfsCID: string
  milestones: GrantFormData["milestones"]
  grantsReceiver: string
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
    ({
      metadataIpfsCID,
      milestones,
      depositAmount,
      votingRoundId,
      milestonesIpfsCID,
      grantsReceiver,
    }: BuildClausesProps) => {
      const clauses: EnhancedClause[] = []

      const calldatas = milestones.map((milestone: GrantFormData["milestones"][0]) =>
        treasuryInterface.encodeFunctionData("transferB3TR", [
          grantsManagerAddress,
          ethers.parseEther(milestone.fundingAmount.toString()),
        ]),
      )
      const totalAmountAsked = milestones.reduce((acc, milestone) => acc + milestone.fundingAmountUsd, 0)
      const args = [
        Array(milestones.length).fill(treasuryAddress),
        Array(milestones.length).fill(0),
        calldatas,
        metadataIpfsCID,
        votingRoundId,
        ethers.parseEther(depositAmount).toString(),
        grantsReceiver,
        milestonesIpfsCID,
      ]
      const comment = `Create new grant asking for ${totalAmountAsked} USD , voting round ${votingRoundId} and grants receiver: ${grantsReceiver}`
      const createProposalClause = buildClause({
        contractInterface: b3trGovernorInterface,
        to: governorContractAddress,
        method: "proposeGrant",
        args,
        comment,
      })

      clauses.push(createProposalClause)

      return clauses
    },
    [],
  )

  const refetchQueryKeys = useMemo(() => {
    return [
      // Invalidate proposal events (this triggers the reactive enrichment)
      getEventsKey({ eventName: "ProposalCreated" }),
      getEventsKey({ eventName: "ProposalCreatedWithType" }),

      // Invalidate proposal states
      getAllProposalsStateQueryKey(),

      // Invalidate metadata queries
      getAllProposalsMetadataQueryKey(),

      // Invalidate user-specific data
      getProposalClaimableUserDepositsQueryKey(account?.address ?? ""),

      // Legacy query keys for backwards compatibility
      getProposalsEventsQueryKey(),
    ]
  }, [account?.address])
  return useBuildTransaction({
    clauseBuilder: buildClauses,
    onSuccess,
    refetchQueryKeys,
    transactionModalCustomUI,
    gasPadding: 0.15,
  })
}
