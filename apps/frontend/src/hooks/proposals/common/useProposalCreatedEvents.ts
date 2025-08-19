import { useMemo } from "react"
import { useEvents } from "@/hooks"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { ProposalType, ProposalCreatedEvent } from "../grants/types"

const b3trGovernorAddress = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi

export const useProposalCreatedEvents = (): {
  standardProposals: ProposalCreatedEvent[]
  grantProposals: ProposalCreatedEvent[]
  allProposals: ProposalCreatedEvent[]
} => {
  const proposalEvents = useEvents({
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalCreated",
    abi,
    mapResponse: response => ({
      id: response.decodedData.args.proposalId.toString(),
      ipfsDescription: response.decodedData.args.description,
      votingRoundId: response.decodedData.args.roundIdVoteStart.toString(),
      depositThreshold: response.decodedData.args.depositThreshold.toString(),
      proposerAddress: response.decodedData.args.proposer,
      calldatas: response.decodedData.args.calldatas,
      targets: response.decodedData.args.targets,
      createdAt: response.meta.blockTimestamp,
      createdAtBlock: response.meta.blockNumber,
    }),
  })

  const proposalTypeEvents = useEvents({
    contractAddress: b3trGovernorAddress,
    eventName: "ProposalCreatedWithType",
    abi,
    mapResponse: response => ({
      id: response.decodedData.args.proposalId.toString(),
      type: response.decodedData.args.proposalType,
    }),
  })

  const { standardProposals, grantProposals, allProposals } = useMemo(() => {
    const typeMap = new Map(proposalTypeEvents.data?.map(proposal => [proposal.id, proposal.type]) ?? [])

    const standard: ProposalCreatedEvent[] = []
    const grant: ProposalCreatedEvent[] = []
    const all: ProposalCreatedEvent[] = []

    proposalEvents.data?.forEach(proposal => {
      const type = typeMap.get(proposal.id) ?? ProposalType.Standard

      const enhancedProposal = {
        ...proposal,
        type,
      }

      all.push(enhancedProposal)
      type === ProposalType.Grant ? grant.push(enhancedProposal) : standard.push(enhancedProposal)
    })

    return { standardProposals: standard, grantProposals: grant, allProposals: all }
  }, [proposalEvents.data, proposalTypeEvents.data])

  return { standardProposals, grantProposals, allProposals }
}
