import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts/factories/GrantsManager__factory"
import { executeMultipleClausesCall, ThorClient } from "@vechain/vechain-kit"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"
import { fetchClient } from "@/api/indexer/api"
import { paths } from "@/api/indexer/schema"
import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import { ProposalType } from "@/types/proposals"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { GrantDetail, GrantMetadata } from "../grants/types"

import { ProposalsPageContent } from "./components/ProposalsPageContent"
import { ProposalDetail, ProposalMetadata } from "./types"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

const grantsManagerAbi = GrantsManager__factory.abi
const grantsManagerContractAddress = getConfig().grantsManagerContractAddress as `0x${string}`

type ProposalVotesQuery = paths["/api/v1/b3tr/proposals/{proposalId}/results"]["get"]
type ProposalVotesQueryResponse = ProposalVotesQuery["responses"]["200"]["content"]["*/*"]
export type ProposalVotes = ProposalVotesQueryResponse[number] & { totalWeight: bigint; totalPower: bigint }

export const getProposalVotesAndMetadata = async (proposal: { proposalId: bigint; description: string }) =>
  Promise.all([
    fetchClient
      .GET("/api/v1/b3tr/proposals/{proposalId}/results", {
        params: { path: { proposalId: proposal.proposalId.toString() } },
      })
      .then(res => res.data as ProposalVotes[]),
    getIpfsMetadata(`ipfs://${proposal.description}`) as Promise<ProposalMetadata | GrantMetadata>,
  ])

export const getProposalsWithTypes = async (thor: ThorClient) => {
  const [proposalCreatedEvents, proposalCreatedWithTypeEvents] = await Promise.all([
    fetchContractEvents({
      thor,
      abi,
      contractAddress: address,
      eventName: "ProposalCreated" as const,
      mapResponse: ({ meta, decodedData }) => ({ ...meta, ...decodedData.args }),
    }),
    fetchContractEvents({
      thor,
      abi,
      contractAddress: address,
      eventName: "ProposalCreatedWithType" as const,
      mapResponse: ({ decodedData }) =>
        [decodedData.args.proposalId, decodedData.args.proposalType] as [bigint, number],
    }),
  ])
  const proposalsTypeMap = new Map(proposalCreatedWithTypeEvents)
  return proposalCreatedEvents.map(event => {
    return {
      ...event,
      type: proposalsTypeMap.get(event.proposalId) || ProposalType.STANDARD,
    }
  })
}

export const getProposalsAndGrants = async (
  thor: ThorClient,
): Promise<{
  proposals: ProposalDetail[]
  grants: GrantDetail[]
}> => {
  // const thor = await getNodeJsThorClient()
  const proposalsWithTypes = await getProposalsWithTypes(thor)
  const proposalsWithVotesAndMetadata = await Promise.all(proposalsWithTypes.map(getProposalVotesAndMetadata))
  const allProposals = proposalsWithTypes.map((proposal, idx) => {
    const [votes, metadata] = proposalsWithVotesAndMetadata[idx] || []
    return {
      ...proposal,
      votes,
      metadata,
    }
  })

  let grants = []
  let proposals = []
  for (const proposal of allProposals) {
    if (proposal.type === ProposalType.GRANT) grants.push(proposal)
    else proposals.push(proposal)
  }

  const [proposalsStates, grantsStates] = await Promise.all([
    executeMultipleClausesCall({
      thor,
      calls: proposals.map(
        proposal =>
          ({
            abi,
            address,
            functionName: "state",
            args: [proposal.proposalId],
          }) as const,
      ),
    }),
    executeMultipleClausesCall({
      thor,
      calls: grants.map(
        grant =>
          ({
            abi: grantsManagerAbi,
            address: grantsManagerContractAddress,
            functionName: "grantState",
            args: [grant.proposalId],
          }) as const,
      ),
    }),
  ])

  grants = grants.map(
    (grant, idx) =>
      ({
        ...grant,
        state: grantsStates[idx],
        targets: [...grant.targets],
        calldatas: [...grant.calldatas],
        metadata: grant.metadata as GrantDetail["metadata"],
      }) as GrantDetail,
  )
  proposals = proposals.map(
    (proposal, idx) =>
      ({
        ...proposal,
        state: proposalsStates[idx],
        targets: [...proposal.targets],
        calldatas: [...proposal.calldatas],
      }) as ProposalDetail,
  )

  return { proposals, grants }
}

export default async function Home() {
  const thor = await getNodeJsThorClient()
  const { proposals } = await getProposalsAndGrants(thor)

  return <ProposalsPageContent proposals={proposals} />
}
