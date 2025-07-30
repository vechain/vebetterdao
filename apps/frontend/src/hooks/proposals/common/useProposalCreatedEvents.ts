import { useMemo } from "react"
import { useEvents } from "@/hooks"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory, Treasury__factory } from "@repo/contracts"
import { formatEther } from "ethers"
import BigNumber from "bignumber.js"
import { Proposal, ProposalType } from "../grants/types"

const b3trGovernorAddress = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const treasuryInterface = Treasury__factory.createInterface()

const getAndDecodeGrantAmount = (calldata?: `0x${string}`) => {
  if (!calldata) return BigNumber(0)
  const decodedData = treasuryInterface.decodeFunctionData("transferB3TR", calldata)
  const formattedAmount = formatEther(decodedData?.[1]?.toString() ?? "0")
  return BigNumber(formattedAmount)
}

export const useProposalCreatedEvents = () => {
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

    const standard: Proposal[] = []
    const grant: Proposal[] = []
    const all: Proposal[] = []

    proposalEvents.data?.forEach(proposal => {
      const type = typeMap.get(proposal.id) ?? ProposalType.Standard
      const enhancedProposal: Proposal = {
        ...proposal,
        type,
        ...(type === ProposalType.Grant && {
          grantAmount: getAndDecodeGrantAmount(proposal.calldatas[0]),
        }),
      }

      all.push(enhancedProposal)
      type === ProposalType.Grant ? grant.push(enhancedProposal) : standard.push(enhancedProposal)
    })

    return { standardProposals: standard, grantProposals: grant, allProposals: all }
  }, [proposalEvents.data, proposalTypeEvents.data])

  return { standardProposals, grantProposals, allProposals }
}
