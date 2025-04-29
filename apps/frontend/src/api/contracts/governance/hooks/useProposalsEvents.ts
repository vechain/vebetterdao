import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { useEvents } from "@/hooks"
import {
  ProposalCanceledEvent,
  ProposalCreatedEvent,
  ProposalDepositEvent,
  ProposalExecutedEvent,
  ProposalQueuedEvent,
} from ".."
const contractInterface = B3TRGovernor__factory.createInterface()
const contractAddress = getConfig().b3trGovernorAddress

/**
 * Hook to get all the proposals events for a user
 * @param proposalId The proposal id to get the proposals events for
 * @param proposer The proposer address to get the proposals events for
 * @returns The proposals events ( weither created, canceled, executed, queued or deposited ) for the user
 */

export const useProposalsEvents = (proposalId?: string, proposer?: string) => {
  const filterParams = { proposer, proposalId }

  if (proposalId) {
    const proposalIdBytes = `0x${BigInt(proposalId).toString(16).padStart(64, "0")}`
    filterParams.proposalId = proposalIdBytes
  }

  const rawProposalCreatedEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "ProposalCreated",
    filterParams,
    mapResponse: (decoded, meta) => ({
      proposalId: decoded.proposalId,
      proposer: decoded.proposer,
      targets: decoded.targets,
      values: decoded.values,
      signatures: decoded.signatures,
      callDatas: decoded.callDatas,
      description: decoded.description,
      roundIdVoteStart: decoded.roundIdVoteStart,
      depositThreshold: decoded.depositThreshold,
      blockMeta: meta,
    }),
  })

  const rawProposalCanceledEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "ProposalCanceled",
    filterParams,
    mapResponse: (decoded, meta) => ({
      proposalId: decoded.proposalId,
      blockMeta: meta,
    }),
  })

  const rawProposalExecutedEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "ProposalExecuted",
    filterParams,
    mapResponse: (decoded, meta) => ({
      proposalId: decoded.proposalId,
      blockMeta: meta,
    }),
  })

  const rawProposalQueuedEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "ProposalQueued",
    filterParams,
    mapResponse: (decoded, meta) => ({
      proposalId: decoded.proposalId,
      etaSeconds: decoded.etaSeconds,
      blockMeta: meta,
    }),
  })

  const rawProposalDepositEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "ProposalDeposit",
    filterParams,
    mapResponse: (decoded, meta) => ({
      depositor: decoded.depositor,
      proposalId: decoded.proposalId,
      amount: decoded.amount,
      blockMeta: meta,
    }),
  })

  const proposalCreatedEvents: ProposalCreatedEvent[] = rawProposalCreatedEvents.data || []
  const proposalCanceledEvents: ProposalCanceledEvent[] = rawProposalCanceledEvents.data || []
  const proposalExecutedEvents: ProposalExecutedEvent[] = rawProposalExecutedEvents.data || []
  const proposalQueuedEvents: ProposalQueuedEvent[] = rawProposalQueuedEvents.data || []
  const proposalDepositEvents: ProposalDepositEvent[] = rawProposalDepositEvents.data || []

  const isLoading =
    rawProposalCreatedEvents.isLoading ||
    rawProposalCanceledEvents.isLoading ||
    rawProposalExecutedEvents.isLoading ||
    rawProposalQueuedEvents.isLoading ||
    rawProposalDepositEvents.isLoading

  return {
    isLoading,
    data: {
      created: proposalCreatedEvents,
      canceled: proposalCanceledEvents,
      executed: proposalExecutedEvents,
      queued: proposalQueuedEvents,
      deposits: proposalDepositEvents,
    },
    errorProposalCanceled: rawProposalCanceledEvents.error,
    errorProposalExecuted: rawProposalExecutedEvents.error,
    errorProposalQueued: rawProposalQueuedEvents.error,
    errorProposalDeposits: rawProposalDepositEvents.error,
    errorProposalCreated: rawProposalCreatedEvents.error,
  }
}
