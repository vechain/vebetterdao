import { useCallback, useMemo } from "react"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { useBuildTransaction } from "./useBuildTransaction"
import {
  getAllProposalsStateQueryKey,
  getProposalClaimableUserDepositsQueryKey,
  getProposalStateQueryKey,
  useProposalCreatedEvent,
} from "@/api"
import { buildClause } from "@/utils/buildClause"
import { ethers } from "ethers"
import { useWallet } from "@vechain/vechain-kit"

const GovernorInterface = B3TRGovernor__factory.createInterface()

type Props = { proposalId: string; onSuccess?: () => void }

export const useCancelProposal = ({ proposalId, onSuccess }: Props) => {
  const { account } = useWallet()
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)

  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        to: getConfig().b3trGovernorAddress,
        contractInterface: GovernorInterface,
        method: "cancel",
        args: [
          proposalCreatedEvent.data?.targets,
          proposalCreatedEvent.data?.values,
          proposalCreatedEvent.data?.callDatas,
          ethers.keccak256(ethers.toUtf8Bytes(proposalCreatedEvent.data?.description || "")),
        ],
        comment: "cancel proposal",
      }),
    ]
  }, [
    proposalCreatedEvent.data?.callDatas,
    proposalCreatedEvent.data?.description,
    proposalCreatedEvent.data?.targets,
    proposalCreatedEvent.data?.values,
  ])

  const refetchQueryKeys = useMemo(
    () => [
      getProposalStateQueryKey(proposalId),
      getAllProposalsStateQueryKey(),
      getProposalClaimableUserDepositsQueryKey(account?.address ?? ""),
    ],
    [proposalId, account?.address],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
