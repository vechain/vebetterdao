import { useQuery } from "@tanstack/react-query"
import { getProposalThreshold, getProposalsEvents } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

export const getProposalsCreatedEventsQueryKey = () => ["proposalCreatedEvents"]
export const useProposalCreatedEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalsCreatedEventsQueryKey(),
    queryFn: async () => await getProposalsEvents(thor),
    enabled: !!thor,
  })
}

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
