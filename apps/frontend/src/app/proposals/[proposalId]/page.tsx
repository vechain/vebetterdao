import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { executeCallClause } from "@vechain/vechain-kit"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"
import { fetchClient } from "@/api/indexer/api"
import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { ProposalType } from "@/hooks/proposals/grants/types"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { ProposalVotes } from "../page"
import { ProposalCreatedEvent, ProposalMetadata } from "../types"

import { ProposalPage } from "./ProposalPage"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

export const getProposalDetails = async (proposalId: string) => {
  const thor = await getNodeJsThorClient()

  let proposal: ProposalCreatedEvent | undefined

  try {
    const [proposalCreatedEvent] = await fetchContractEvents({
      thor,
      abi,
      contractAddress: address,
      eventName: "ProposalCreated" as const,
      filterParams: [BigInt(proposalId)],
      mapResponse: ({ meta, decodedData }) => ({ ...meta, ...decodedData.args }),
    })

    if (proposalCreatedEvent)
      proposal = {
        ...proposalCreatedEvent,
        targets: [...proposalCreatedEvent.targets],
        calldatas: [...proposalCreatedEvent.calldatas],
      }
  } catch {}

  if (!proposal || !proposal.description) return null

  const [votes = [], metadata, [state = 0] = []] = await Promise.all([
    fetchClient
      .GET("/api/v1/b3tr/proposals/{proposalId}/results", {
        params: { path: { proposalId: proposalId } },
      })
      .then(res => res.data as ProposalVotes[]),
    getIpfsMetadata(`ipfs://${proposal.description}`) as Promise<ProposalMetadata>,
    executeCallClause({
      thor,
      abi,
      contractAddress: address,
      method: "state",
      args: [BigInt(proposalId)],
    }),
  ])

  return {
    ...proposal,
    type: ProposalType.Standard,
    state,
    votes,
    metadata,
  }
}

export type Props = { params: { proposalId: string } }

export default async function Proposal({ params }: Readonly<Props>) {
  const proposal = await getProposalDetails(params.proposalId)

  if (!proposal) return null

  return <ProposalPage proposal={proposal} />
}
