import { useQuery } from "@tanstack/react-query"
import { getProposalThreshold, getProposalsEvents } from "./endpoints"
import { useConnex } from "@vechain/dapp-kit-react"

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
