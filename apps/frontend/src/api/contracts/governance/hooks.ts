import { useQuery } from "@tanstack/react-query"
import { getProposalState, getProposalThreshold, getProposalsEvents } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

export const getProposalThresholdQueryKey = () => ["proposalThreshold"]
/**
 *  Hook to get the proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @returns
 */
export const useProposalThreshold = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalThresholdQueryKey(),
    queryFn: async () => await getProposalThreshold(thor),
    enabled: !!thor,
  })
}

export const getProposalEvents = () => ["proposalsEvents"]

/**
 *  Hook to get the proposals events from the governor contract (i.e the proposals created, canceled and executed)
 * @returns  the proposals events
 */
export const useProposalsEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalEvents(),
    queryFn: async () => await getProposalsEvents(thor),
    enabled: !!thor,
  })
}

export const getActiveProposalsQueryKey = () => ["proposals", "active"]
/**
 *  Hook to get the active proposals events from the governor contract (i.e the proposals created, not canceled, expired and not queued/executed)
 * @returns  the active proposals events (i.e the proposals created, not canceled, expired and not queued/executed)
 */
export const useActiveProposals = () => {
  const { thor } = useConnex()
  const { data: proposalsEvents } = useProposalsEvents()

  //TODO: what if the first query fails ? client of useActiveProposals will not be aware of it
  return useQuery({
    queryKey: getActiveProposalsQueryKey(),
    queryFn: async () => {
      if (!thor) return
      if (!proposalsEvents) return

      const lastBlock = thor.status.head.number

      return proposalsEvents.created.filter(
        proposal =>
          Number(proposal.voteStart) < lastBlock &&
          Number(proposal.voteEnd) > lastBlock &&
          !proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId) &&
          !proposalsEvents.executed.some(executedProposal => executedProposal.proposalId === proposal.proposalId) &&
          !proposalsEvents.queued.some(queuedProposal => queuedProposal.proposalId === proposal.proposalId),
      )
    },
    enabled: !!thor && !!proposalsEvents,
  })
}

export const getIncomingProposalsQueryKey = () => ["proposals", "incoming"]
/**
 *  Hook to get the incoming proposals using on-chain events (i.e the proposals not started yet and not canceled)
 * @returns  the incoming proposals events (i.e the proposals not started yet and not canceled)
 */
export const useIncomingProposals = () => {
  const { thor } = useConnex()
  const { data: proposalsEvents } = useProposalsEvents()

  //TODO: what if the first query fails ? client of useActiveProposals will not be aware of it
  return useQuery({
    queryKey: getIncomingProposalsQueryKey(),
    queryFn: async () => {
      if (!thor) return
      if (!proposalsEvents) return

      const lastBlock = thor.status.head.number

      return proposalsEvents.created.filter(
        proposal =>
          Number(proposal.voteStart) > lastBlock &&
          !proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId),
      )
    },
    enabled: !!thor && !!proposalsEvents,
  })
}

export const getPastProposalsQueryKey = () => ["proposals", "past"]
/**
 *  Hook to get the past proposals using on-chain events (i.e the proposals expired, canceled, queued or executed)
 * @returns  the past proposals events (i.e the proposals expired, canceled, queued or executed)
 */
export const usePastProposals = () => {
  const { thor } = useConnex()
  const { data: proposalsEvents } = useProposalsEvents()

  //TODO: what if the first query fails ? client of useActiveProposals will not be aware of it
  return useQuery({
    queryKey: getPastProposalsQueryKey(),
    queryFn: async () => {
      if (!thor) return
      if (!proposalsEvents) return

      const lastBlock = thor.status.head.number

      return proposalsEvents.created.filter(
        proposal =>
          Number(proposal.voteEnd) < lastBlock ||
          proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId) ||
          proposalsEvents.executed.some(executedProposal => executedProposal.proposalId === proposal.proposalId) ||
          proposalsEvents.queued.some(queuedProposal => queuedProposal.proposalId === proposal.proposalId),
      )
    },
    enabled: !!thor && !!proposalsEvents,
  })
}

export const getProposalStateQueryKey = (proposalId: string) => ["proposalState", proposalId]
/**
 *  Hook to get the proposal state from the governor contract
 * @param proposalId  the proposal id to get the state of
 * @returns  the proposal state
 */
export const useProposalState = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalStateQueryKey(proposalId),
    queryFn: async () => await getProposalState(thor, proposalId),
    enabled: !!thor,
  })
}
