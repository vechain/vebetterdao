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

export const getProposalsDepositReached = async (
  thor: ThorClient,
  proposalIds: bigint[],
): Promise<Map<string, boolean>> => {
  if (proposalIds.length === 0) return new Map()

  const depositReachedResults = await executeMultipleClausesCall({
    thor,
    calls: proposalIds.map(
      id =>
        ({
          abi,
          address,
          functionName: "proposalDepositReached",
          args: [id],
        }) as const,
    ),
  })

  const depositReachedMap = new Map<string, boolean>()
  proposalIds.forEach((id, idx) => {
    depositReachedMap.set(id.toString(), depositReachedResults[idx] as boolean)
  })

  return depositReachedMap
}

export const getProposalsDepositEvents = async (
  thor: ThorClient,
): Promise<Map<string, { communityDeposits: number; supportingUserCount: number }>> => {
  const depositEvents = await fetchContractEvents({
    thor,
    abi,
    contractAddress: address,
    eventName: "ProposalDeposit",
    mapResponse: ({ decodedData }) => ({
      proposalId: (decodedData.args.proposalId as bigint).toString(),
      amount: decodedData.args.amount,
      depositor: decodedData.args.depositor,
    }),
  })

  const aggregatedData = new Map<string, { depositors: Set<string>; totalAmount: bigint }>()

  depositEvents.forEach(event => {
    const existing = aggregatedData.get(event.proposalId) || {
      depositors: new Set<string>(),
      totalAmount: BigInt(0),
    }
    existing.depositors.add(event.depositor.toLowerCase())
    existing.totalAmount += BigInt(event.amount)
    aggregatedData.set(event.proposalId, existing)
  })

  const result = new Map<string, { communityDeposits: number; supportingUserCount: number }>()
  aggregatedData.forEach((data, proposalId) => {
    result.set(proposalId, {
      communityDeposits: Number(data.totalAmount) / 1e18,
      supportingUserCount: data.depositors.size,
    })
  })

  return result
}

export const getProposalsInteractionDates = async (
  thor: ThorClient,
  proposalIds: bigint[],
): Promise<Map<string, { supportEndDate: number | null; votingEndDate: number | null }>> => {
  if (proposalIds.length === 0) return new Map()

  const [snapshotsResults, deadlinesResults, currentBlock] = await Promise.all([
    executeMultipleClausesCall({
      thor,
      calls: proposalIds.map(
        id =>
          ({
            abi,
            address,
            functionName: "proposalSnapshot",
            args: [id],
          }) as const,
      ),
    }),
    executeMultipleClausesCall({
      thor,
      calls: proposalIds.map(
        id =>
          ({
            abi,
            address,
            functionName: "proposalDeadline",
            args: [id],
          }) as const,
      ),
    }),
    thor.blocks.getBestBlockExpanded(),
  ])

  if (!currentBlock) return new Map()

  const BLOCK_TIME_SECONDS = 10
  const currentBlockNumber = currentBlock.number

  const datesMap = new Map<string, { supportEndDate: number | null; votingEndDate: number | null }>()

  proposalIds.forEach((id, idx) => {
    const snapshot = snapshotsResults[idx]
    const deadline = deadlinesResults[idx]

    const snapshotBlockDiff = Number(snapshot) - currentBlockNumber
    const deadlineBlockDiff = Number(deadline) - currentBlockNumber

    const supportEndDate = snapshotBlockDiff > 0 ? Date.now() + snapshotBlockDiff * BLOCK_TIME_SECONDS * 1000 : null

    const votingEndDate = deadlineBlockDiff > 0 ? Date.now() + deadlineBlockDiff * BLOCK_TIME_SECONDS * 1000 : null

    datesMap.set(id.toString(), { supportEndDate, votingEndDate })
  })

  return datesMap
}

export const getProposalsAndGrants = async (
  thor: ThorClient,
): Promise<{
  proposals: ProposalDetail[]
  grants: GrantDetail[]
}> => {
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

  const allProposalIds = allProposals.map(p => p.proposalId)

  const [proposalsStates, grantsStates, depositReachedMap, depositEventsMap, interactionDatesMap] = await Promise.all([
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
    getProposalsDepositReached(thor, allProposalIds),
    getProposalsDepositEvents(thor),
    getProposalsInteractionDates(thor, allProposalIds),
  ])

  grants = grants.map((grant, idx) => {
    const proposalIdStr = grant.proposalId.toString()
    const depositData = depositEventsMap.get(proposalIdStr) || { communityDeposits: 0, supportingUserCount: 0 }
    const dates = interactionDatesMap.get(proposalIdStr) || { supportEndDate: null, votingEndDate: null }

    return {
      ...grant,
      state: grantsStates[idx],
      targets: [...grant.targets],
      calldatas: [...grant.calldatas],
      metadata: grant.metadata as GrantDetail["metadata"],
      depositReached: depositReachedMap.get(proposalIdStr) || false,
      communityDeposits: depositData.communityDeposits,
      supportingUserCount: depositData.supportingUserCount,
      interactionDates: {
        supportEndDate: dates.supportEndDate,
        votingEndDate: dates.votingEndDate,
      },
    } as GrantDetail
  })
  proposals = proposals.map((proposal, idx) => {
    const proposalIdStr = proposal.proposalId.toString()
    const depositData = depositEventsMap.get(proposalIdStr) || { communityDeposits: 0, supportingUserCount: 0 }
    const dates = interactionDatesMap.get(proposalIdStr) || { supportEndDate: null, votingEndDate: null }

    return {
      ...proposal,
      state: proposalsStates[idx],
      targets: [...proposal.targets],
      calldatas: [...proposal.calldatas],
      depositReached: depositReachedMap.get(proposalIdStr) || false,
      communityDeposits: depositData.communityDeposits,
      supportingUserCount: depositData.supportingUserCount,
      interactionDates: {
        supportEndDate: dates.supportEndDate,
        votingEndDate: dates.votingEndDate,
      },
    } as ProposalDetail
  })

  return { proposals, grants }
}

export default async function Home() {
  const thor = await getNodeJsThorClient()
  const { proposals } = await getProposalsAndGrants(thor)

  return <ProposalsPageContent proposals={proposals} />
}
