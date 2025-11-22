import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts/factories/GrantsManager__factory"
import { executeCallClause } from "@vechain/vechain-kit"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"
import { fetchClient } from "@/api/indexer/api"
import { getIpfsMetadata } from "@/api/ipfs/hooks/useIpfsMetadata"
import {
  ProposalVotes,
  getProposalsDepositReached,
  getProposalsDepositEvents,
  getProposalsInteractionDates,
} from "@/app/proposals/page"
import { ProposalCreatedEvent } from "@/app/proposals/types"
import { ProposalType } from "@/hooks/proposals/grants/types"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { GrantDetail, GrantMetadata } from "../types"

import { GrantPage } from "./GrantPage"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

const grantsManagerAbi = GrantsManager__factory.abi
const grantsManagerContractAddress = getConfig().grantsManagerContractAddress as `0x${string}`

export type Props = { params: { grantId: string } }

export const getGrantsDetails = async (grantId: string): Promise<GrantDetail | null> => {
  const thor = await getNodeJsThorClient()

  let grant: ProposalCreatedEvent | undefined

  try {
    const [proposalCreatedEvent] = await fetchContractEvents({
      thor,
      abi,
      contractAddress: address,
      eventName: "ProposalCreated" as const,
      filterParams: [BigInt(grantId)],
      mapResponse: ({ meta, decodedData }) => ({ ...meta, ...decodedData.args }),
    })

    if (proposalCreatedEvent)
      grant = {
        ...proposalCreatedEvent,
        targets: [...proposalCreatedEvent.targets],
        calldatas: [...proposalCreatedEvent.calldatas],
      }
  } catch {}

  if (!grant || !grant.description) return null

  const [votes, metadata, [state = 0] = [], depositReachedMap, depositEventsMap, interactionDatesMap] =
    await Promise.all([
      fetchClient
        .GET("/api/v1/b3tr/proposals/{proposalId}/results", {
          params: { path: { proposalId: grantId } },
        })
        .then(res => res.data as ProposalVotes[]),
      getIpfsMetadata(`ipfs://${grant.description}`) as Promise<GrantMetadata>,
      executeCallClause({
        thor,
        abi: grantsManagerAbi,
        contractAddress: grantsManagerContractAddress,
        method: "grantState",
        args: [BigInt(grantId)],
      }),
      getProposalsDepositReached(thor, [BigInt(grantId)]),
      getProposalsDepositEvents(thor),
      getProposalsInteractionDates(thor, [BigInt(grantId)]),
    ])

  const depositData = depositEventsMap.get(grantId) || { communityDeposits: 0, supportingUserCount: 0 }
  const dates = interactionDatesMap.get(grantId) || { supportEndDate: null, votingEndDate: null }

  return {
    ...grant,
    type: ProposalType.Grant,
    state,
    votes,
    metadata,
    depositReached: depositReachedMap.get(grantId) || false,
    communityDeposits: depositData.communityDeposits,
    supportingUserCount: depositData.supportingUserCount,
    interactionDates: {
      supportEndDate: dates.supportEndDate,
      votingEndDate: dates.votingEndDate,
    },
  }
}

export default async function Grant({ params }: Readonly<Props>) {
  const grant = await getGrantsDetails(params.grantId)

  // TODO: show error page
  if (!grant) return null

  return <GrantPage grant={grant} />
}
